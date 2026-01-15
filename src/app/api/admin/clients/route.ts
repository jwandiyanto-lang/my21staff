import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

function generateTempPassword(): string {
  // Generate a readable temporary password
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let password = 'Welcome'
  for (let i = 0; i < 4; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password + '!'
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50)
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Check if user is authenticated and is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin status
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['owner', 'admin'])
      .limit(1)
      .single()

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    const isAdmin = !!membership || profile?.is_admin

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { fullName, email, businessName } = body

    if (!fullName || !email || !businessName) {
      return NextResponse.json(
        { error: 'Missing required fields: fullName, email, businessName' },
        { status: 400 }
      )
    }

    // Generate temp password and slug
    const tempPassword = generateTempPassword()
    const baseSlug = generateSlug(businessName)

    // Check if slug exists and make unique if needed
    let slug = baseSlug
    let counter = 1
    while (true) {
      const { data: existing } = await supabase
        .from('workspaces')
        .select('id')
        .eq('slug', slug)
        .single()

      if (!existing) break
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Create user with admin client (bypasses RLS)
    const { data: newUser, error: createUserError } = await adminSupabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    })

    if (createUserError || !newUser.user) {
      console.error('Create user error:', createUserError)
      return NextResponse.json(
        { error: createUserError?.message || 'Failed to create user' },
        { status: 500 }
      )
    }

    // Create workspace (using admin client owner_id as the creating admin)
    const { data: workspace, error: workspaceError } = await adminSupabase
      .from('workspaces')
      .insert({
        name: businessName,
        slug,
        owner_id: newUser.user.id, // The client is the owner of their workspace
      })
      .select('id, name, slug')
      .single()

    if (workspaceError || !workspace) {
      // Rollback: delete the user we just created
      await adminSupabase.auth.admin.deleteUser(newUser.user.id)
      console.error('Create workspace error:', workspaceError)
      return NextResponse.json(
        { error: workspaceError?.message || 'Failed to create workspace' },
        { status: 500 }
      )
    }

    // Add user to workspace_members with must_change_password = true
    const { error: memberError } = await adminSupabase
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: newUser.user.id,
        role: 'member', // Client is a member, not owner/admin of the platform
        must_change_password: true,
      })

    if (memberError) {
      // Rollback: delete workspace and user
      await adminSupabase.from('workspaces').delete().eq('id', workspace.id)
      await adminSupabase.auth.admin.deleteUser(newUser.user.id)
      console.error('Create member error:', memberError)
      return NextResponse.json(
        { error: memberError?.message || 'Failed to add user to workspace' },
        { status: 500 }
      )
    }

    // Also add the admin as owner of this new workspace (so they can manage it)
    await adminSupabase
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: user.id, // Current admin user
        role: 'owner',
        must_change_password: false,
      })
      .single()

    return NextResponse.json({
      email,
      password: tempPassword,
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
      },
    })
  } catch (error) {
    console.error('Create client error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
