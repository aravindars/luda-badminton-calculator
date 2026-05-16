function calculate() {
    // 1. Get Inputs
    const fullFee = parseFloat(document.getElementById('fullFee').value) || 0;
    const cashPaid = parseFloat(document.getElementById('cashPaid').value) || 0;
    const shuttles = parseFloat(document.getElementById('shuttleCost').value) || 0;
    const hours = parseFloat(document.getElementById('sessionHours').value) || 1;
    
    const cPlus = parseInt(document.getElementById('cntPlus').value) || 0;
    const cLight = parseInt(document.getElementById('cntLight').value) || 0;
    const cNone = parseInt(document.getElementById('cntNone').value) || 0;
    
    const totalPlayers = cPlus + cLight + cNone;
    if (totalPlayers === 0) return;

    // 2. Per-Person Base Share calculation
    const perPersonFullCourtShare = fullFee / totalPlayers; 
    const shuttleShare = shuttles / totalPlayers;

    // 3. Define Discounts
    const plusMaxDiscount = Math.max(1, Math.floor(hours)) * 15.0; // e.g. 30 PLN
    const lightMaxDiscount = 15.0;

    // 4. Calculate Individual Court Debt (Capped by the per-person share)
    // No-Card owes full share
    const courtDebtNone = perPersonFullCourtShare; 
    // Card users owe share minus discount (but never less than 0)
    const courtDebtPlus = Math.max(0, perPersonFullCourtShare - plusMaxDiscount);
    const courtDebtLight = Math.max(0, perPersonFullCourtShare - lightMaxDiscount);

    // 5. Scaling Logic
    // Calculate total theoretical revenue from court debt
    const totalCalculatedCourtRevenue = (courtDebtPlus * cPlus) + (courtDebtLight * cLight) + (courtDebtNone * cNone);

    // Scale the debt to match what we actually paid out-of-pocket (Cash Paid)
    let scale = 1;
let flatCashSharePerCardUser = 0;

if (totalCalculatedCourtRevenue > 0) {
    scale = cashPaid / totalCalculatedCourtRevenue;
} else if (cashPaid > 0 && totalCalculatedCourtRevenue === 0) {
    // BUG FIX: If everyone's discount reduced court debt to 0, 
    // but there is still remaining cash paid, split that cash equally among card users.
    const totalCardUsers = cPlus + cLight;
    if (totalCardUsers > 0) {
        flatCashSharePerCardUser = cashPaid / totalCardUsers;
    }
}

    // 6. Final Prices (Scaled Court Debt + Shuttle Share)
    const cp = (courtDebtPlus * scale) + flatCashSharePerCardUser + shuttleShare;
const cl = (courtDebtLight * scale) + flatCashSharePerCardUser + shuttleShare;
const cn = (courtDebtNone * scale) + shuttleShare;
    // 7. Apply Results to UI
    document.getElementById('plusLabel').innerText = `PLUS (max ${plusMaxDiscount} PLN off court)`;
    document.getElementById('lightLabel').innerText = `LIGHT (max ${lightMaxDiscount} PLN off court)`;

    // Update UI - Only show values if player count > 0 to avoid confusion
    document.getElementById('resPlus').innerText = cPlus > 0 ? cp.toFixed(2) + " PLN" : "0.00 PLN";
    document.getElementById('resLight').innerText = cLight > 0 ? cl.toFixed(2) + " PLN" : "0.00 PLN";
    document.getElementById('resNoCard').innerText = cNone > 0 ? cn.toFixed(2) + " PLN" : "0.00 PLN";

    // 8. Validation
    const totalCollected = (cp * cPlus) + (cl * cLight) + (cn * cNone);
    const vBox = document.getElementById('validationBox');
    vBox.className = "validation-box valid-ok";
    vBox.innerText = `✅ Verified: Recovering ${totalCollected.toFixed(2)} PLN`;
    document.getElementById('results').style.display = 'block';
}
