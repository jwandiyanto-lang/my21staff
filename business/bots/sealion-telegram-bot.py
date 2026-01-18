"""
Sea-Lion Telegram Bot
Connects to Sea-Lion running on Ikigo (localhost:11434)
"""
import asyncio
import aiohttp
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

# ============ CONFIG ============
TELEGRAM_TOKEN = "8517850337:AAGgvf1sVCREqYttDoZ7CJpYAXOY0-I6jeM"
SEALION_URL = "http://localhost:11434/v1/chat/completions"
SEALION_MODEL = "aisingapore/Gemma-SEA-LION-v3-9B-IT:q2_k"
# ================================


async def chat_with_sealion(message: str) -> str:
    """Send message to Sea-Lion and get response."""
    async with aiohttp.ClientSession() as session:
        payload = {
            "model": SEALION_MODEL,
            "messages": [{"role": "user", "content": message}]
        }
        try:
            async with session.post(SEALION_URL, json=payload, timeout=aiohttp.ClientTimeout(total=120)) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data["choices"][0]["message"]["content"]
                return "Maaf, ada gangguan. Coba lagi nanti ya."
        except asyncio.TimeoutError:
            return "Maaf, responsenya lama banget. Coba lagi ya."
        except Exception as e:
            print(f"Error: {e}")
            return "Maaf, ada error. Coba lagi nanti."


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command."""
    await update.message.reply_text(
        "Halo! Aku bot yang pakai Sea-Lion AI.\n"
        "Tanya apa aja dalam Bahasa Indonesia!"
    )


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle incoming messages - responds to any text."""
    user_message = update.message.text

    # Show typing indicator while waiting for Sea-Lion
    await update.message.chat.send_action("typing")

    # Get response from Sea-Lion
    response = await chat_with_sealion(user_message)

    # Send response back to user
    await update.message.reply_text(response)


def main():
    """Run the bot."""
    if TELEGRAM_TOKEN == "YOUR_BOT_TOKEN":
        print("ERROR: Please set your TELEGRAM_TOKEN first!")
        print("Get one from @BotFather on Telegram")
        return

    app = Application.builder().token(TELEGRAM_TOKEN).build()

    # Handlers
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    # Start polling
    print("Sea-Lion Telegram Bot is running...")
    print(f"Using model: {SEALION_MODEL}")
    print(f"Sea-Lion API: {SEALION_URL}")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
