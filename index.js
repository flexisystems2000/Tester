const makeWASocket = require('@musteqeem/baileys').default;
const { useMultiFileAuthState, DisconnectReason } = require('@musteqeem/baileys');
const pino = require('pino');

// Set your target registration phone credentials
const phoneNumber = "2347033855206"; 

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_session');

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false // Disabled since we are explicitly requesting a pairing code
    });

    // Handle pairing logic if session doesn't exist yet
    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber);
                // Format the code visually into the standard XXXX-XXXX style
                code = code?.match(/.{1,4}/g)?.join('-') || code;
                console.clear();
                console.log('\n==================================================');
                console.log(`🔑 YOUR WHATSAPP PAIRING CODE: \x1b[32m${code}\x1b[0m`);
                console.log('==================================================\n');
                console.log('Instructions:\n1. Open WhatsApp on your phone.\n2. Go to Settings > Linked Devices > Link a Device.\n3. Tap "Link with phone number instead" and input the code above.\n');
            } catch (err) {
                console.error('Failed to generate pairing code:', err);
            }
        }, 3000); // 3-second delay to ensure socket registers connection layer first
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection dropped. Attempting reconnect:', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.clear();
            console.log('==============================================');
            console.log('✅ SUCCESS: Bot linked and active via pairing!');
            console.log('Send ".test-table" in any chat to view output.');
            console.log('==============================================');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        if (m.type !== 'notify') return;

        for (const msg of m.messages) {
            if (msg.key.fromMe) continue;

            const jid = msg.key.remoteJid;
            const textContent = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

            if (!textContent) continue;

            if (textContent.trim().toLowerCase() === '.test-table') {
                console.log(`Executing layout array transmission context to: ${jid}`);

                try {
                    // Directly injecting Meta AI structure payload formatting properties
                    await sock.sendMessage(jid, { 
                        richResponse: { 
                            text: '*TikTok Stalk Profile Info*',
                            table: {
                                title: 'Ttstalk itsjustspykid',
                                headers: ['Field', 'Value'],
                                rows: [
                                    ['Name', 'Spykid FF'],
                                    ['Username', '@itsjustspykid'],
                                    ['Bio', 'Drop a follow // - Di'],
                                    ['Verified', 'No'],
                                    ['Private', 'No'],
                                    ['Followers', '70']
                                ]
                            }
                        } 
                    });
                } catch (error) {
                    console.error('Payload processing execution exception:', error.message);
                    await sock.sendMessage(jid, { 
                        text: "⚠️ Core structure dropped. Current package cannot resolve rich layout proto formatting hooks." 
                    });
                }
            }
        }
    });
}

startBot();
