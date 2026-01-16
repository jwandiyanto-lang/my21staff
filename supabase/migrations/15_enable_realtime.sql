-- Enable Realtime for messages and conversations tables
-- This allows the inbox to receive live updates when new messages arrive

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Enable realtime for conversations table
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
