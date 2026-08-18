/**
 * Stub for sending WhatsApp messages.
 * Structured so a real API call (e.g., Twilio or Meta WhatsApp Business API)
 * can be dropped in later without changing the function signature.
 */
const sendWhatsAppMessage = async (phone, message) => {
  try {
    console.log('\n[WhatsApp Stub] Sending message...');
    console.log(`[WhatsApp Stub] To: ${phone}`);
    console.log(`[WhatsApp Stub] Message:\n${message}\n`);
    
    // TODO: Implement real WhatsApp API call here in the future
    
    return { success: true, status: 'stubbed' };
  } catch (error) {
    console.error('[WhatsApp Stub] Error:', error);
    throw error;
  }
};

module.exports = {
  sendWhatsAppMessage
};
