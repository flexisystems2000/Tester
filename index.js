const makeWASocket = require('@innovatorssoft/baileys').default;
const { useMultiFileAuthState, DisconnectReason, Browsers } = require('@innovatorssoft/baileys');
const pino = require('pino');

// Target authentication routing properties
const phoneNumber = "2347033855206"; 

async function startUnifiedBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_session');

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.ubuntu('Chrome') // Guarantees smooth pairing authentication handshake
    });

    // Request Pairing Code sequence if session data is unauthenticated
    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber);
                code = code?.match(/.{1,4}/g)?.join('-') || code;
                console.clear();
                console.log('\n==================================================');
                console.log(`🔑 YOUR NEW PAIRING CODE: \x1b[32m${code}\x1b[0m`);
                console.log('==================================================\n');
            } catch (err) {
                console.error('Pairing registration layer failed:', err.message);
            }
        }, 3000);
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection interrupted. Restoring socket stream:', shouldReconnect);
            if (shouldReconnect) startUnifiedBot();
        } else if (connection === 'open') {
            console.clear();
            console.log('==================================================');
            console.log('✅ SUCCESS: Bot completely configured on innovatorssoft!');
            console.log('Send ".test-table" inside any chat thread now.');
            console.log('==================================================');
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
                console.log(`Sending native layout interface directly to target JID: ${jid}`);

                try {
                    // Custom protocol rendering execution made native via this package fork
                    await sock.sendTable(
                        jid, 
                        'Ttstalk itsjustspykid', // The exact grey card subtitle block layout
                        ['Field', 'Value'],      // Native table headers array
                        [
                            ['Name', 'Spykid FF'],
                            ['Username', '@itsjustspykid'],
                            ['Bio', 'Drop a follow // - Di'],
                            ['Verified', 'No'],
                            ['Private', 'No'],
                            ['Followers', '70'],
                            ['Following', '135'],
                            ['Total likes', '3,962'],
                            ['Videos', 'N/A'],
                            ['Friends', '31'],
                            ['Profile', 'https://tiktok.com']
                        ]
                    );
                } catch (error) {
                    console.error('UI rendering array fault:', error.message);
                }
            }
        }
    });
}

startUnifiedBot();
