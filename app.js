// 1. SUPABASE CONFIGURATION
const SUPABASE_URL = 'https://kozmxgymkitcbevtufgz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_sMp15iZ3aHBEz44x6YzISA_3fihZSgX';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Global Variables
window.coins = 0;
let userId = null;

/**
 * INIT APP: Ye function user ki authentication aur block status check karta hai
 */
async function initApp() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        if (user) {
            userId = user.id;
            // Fetch User Profile with Block Status
            const { data: profile, error } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;

            // SECURITY: Check if user is blocked by admin
            if (profile.is_blocked) {
                alert("ACCESS DENIED: Your account has been blocked by the Administrator.");
                await supabaseClient.auth.signOut();
                window.location.replace('login.html');
                return;
            }

            // Set Global Balance
            window.coins = Number(profile.coins || 0);
            
            // UI Sync
            syncAllCoinDisplays();
            
            // Auto Sync (Har 2 second mein balance update karega)
            setInterval(syncAllCoinDisplays, 2000);

        } else {
            // Agar login nahi hai aur admin panel nahi khula hai toh login par bhejo
            // index.html (admin) par login check ko skip kar sakte hain agar aapne bypass rakha hai
            console.log("No active session found.");
        }
    } catch (err) {
        console.error("Initialization Error:", err.message);
    }
}

/**
 * SYNC ALL COIN DISPLAYS: Puri app mein jahan bhi coins dikhane hain, ye handle karega
 */
function syncAllCoinDisplays() {
    const coinSelectors = [
        'home-coins', 
        'game-coins', 
        'ad-coins', 
        'p-coins', 
        'wallet-coins', 
        'gift-coins', 
        'user-coins',
        'realtime-coins'
    ];

    coinSelectors.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerText = window.coins;
        }
    });
}

/**
 * UPDATE COINS: Coins ko database mein save karne ke liye helper function
 */
async function updateDatabaseCoins(amountToAdd) {
    if (!userId) return;

    const newBalance = window.coins + amountToAdd;
    const { error } = await supabaseClient
        .from('profiles')
        .update({ coins: newBalance })
        .eq('id', userId);

    if (!error) {
        window.coins = newBalance;
        syncAllCoinDisplays();
        return true;
    } else {
        console.error("Database Update Failed:", error.message);
        return false;
    }
}

// Start the App
initApp();
              
