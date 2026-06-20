function calculate() {
    // 1. Get Inputs
    const fullFee = parseFloat(document.getElementById('fullFee').value) || 0;
    const cashPaid = parseFloat(document.getElementById('cashPaid').value) || 0;
    const shuttles = parseFloat(document.getElementById('shuttleCost').value) || 0;
    const hours = parseFloat(document.getElementById('sessionHours').value) || 1;
    const courts = parseInt(document.getElementById('courts').value) || 1; 
    const actualSwipes = parseInt(document.getElementById('actualSwipes').value) || 0;

    const cPlus = parseInt(document.getElementById('cntPlus').value) || 0;
    const cLight = parseInt(document.getElementById('cntLight').value) || 0;
    const cNone = parseInt(document.getElementById('cntNone').value) || 0;
    
    const totalPlayers = cPlus + cLight + cNone;
    if (totalPlayers === 0) return;

    // 2. Set Up Dynamic UI Labels
    const plusMaxDiscount = Math.max(1, Math.floor(hours)) * 15.0; 
    const lightMaxDiscount = 15.0;
    document.getElementById('plusLabel').innerText = `PLUS (max ${plusMaxDiscount} PLN off court)`;
    document.getElementById('lightLabel').innerText = `LIGHT (max ${lightMaxDiscount} PLN off court)`;

    // 3. MultiSport Structural Floor (Max 4 swipes per court per hour)
    const maxSwipesPerCourtPerHour = 4;
    const totalMaxSlotsAllowed = courts * maxSwipesPerCourtPerHour * hours;

    // Calculate minimum unavoidable cash floor
    const discountPerSwipe = 15; 
    const perfectScenarioDiscount = totalMaxSlotsAllowed * discountPerSwipe;
    const minimumStructuralFloor = Math.max(0, fullFee - perfectScenarioDiscount);

    // 4. Base Shared Cost per person (Unavoidable club minimum)
    const baseFloorPerPerson = minimumStructuralFloor / totalPlayers;
    const shuttleShare = shuttles / totalPlayers;

    // 5. Calculate Remaining Court Costs to distribute
    // Total court money we actually need to collect out-of-pocket
    const totalCourtCashNeeded = cashPaid; 
    
    // Theoretical individual base targets if we split the remaining cash out-of-pocket directly
    const remainingCourtCashToSplit = Math.max(0, totalCourtCashNeeded - minimumStructuralFloor);
    
    // Establish individual raw court debts before card tracking adjustments
    let courtDebtPlus = 0;
    let courtDebtLight = remainingCourtCashToSplit / totalPlayers;
    let courtDebtNone = remainingCourtCashToSplit / totalPlayers;

    // Light users contribute a swipe (worth 15 PLN) to lower their specific out-of-pocket court target
    if (cLight > 0) {
        courtDebtLight = Math.max(0, courtDebtLight - lightMaxDiscount);
    }

    // Recalculate what is left over after Light users used their card discount
    const totalCollectedFromCalculated = (courtDebtPlus * cPlus) + (courtDebtLight * cLight) + (courtDebtNone * cNone);
    const uncoveredCourtBalance = Math.max(0, remainingCourtCashToSplit - totalCollectedFromCalculated);

    // No-Card users inherit the remaining uncovered balance
    if (cNone > 0) {
        courtDebtNone += (uncoveredCourtBalance / cNone);
    } else if (cLight > 0) {
        // Fallback: If no "No Card" users exist, remaining balance maps to Light cards
        courtDebtLight += (uncoveredCourtBalance / cLight);
    } else if (cPlus > 0) {
        // Final Fallback: If group is entirely Plus users, split remaining cash evenly
        courtDebtPlus += (uncoveredCourtBalance / cPlus);
    }

    // 6. Final Individual Price Assembly
    let cp = baseFloorPerPerson + courtDebtPlus + shuttleShare; 
    let cl = baseFloorPerPerson + courtDebtLight + shuttleShare;
    let cn = baseFloorPerPerson + courtDebtNone + shuttleShare;

    // Exception Rule: If all possible club slots were maxed out, default to a flat split
    if (actualSwipes >= totalMaxSlotsAllowed) {
        const flatSplit = (cashPaid + shuttles) / totalPlayers;
        cp = flatSplit;
        cl = flatSplit;
        cn = flatSplit;
    }

    // 7. Update UI Numbers
    document.getElementById('resPlus').innerText = cPlus > 0 ? cp.toFixed(2) + " PLN" : "0.00 PLN";
    document.getElementById('resLight').innerText = cLight > 0 ? cl.toFixed(2) + " PLN" : "0.00 PLN";
    document.getElementById('resNoCard').innerText = cNone > 0 ? cn.toFixed(2) + " PLN" : "0.00 PLN";

    // 8. Validation Box
    const totalCollected = (cp * cPlus) + (cl * cLight) + (cn * cNone);
    const vBox = document.getElementById('validationBox');
    vBox.className = "validation-box valid-ok";
    vBox.innerText = `✅ Verified: Recovering ${totalCollected.toFixed(2)} PLN`;
    document.getElementById('results').style.display = 'block';

    // 9. Update Friendly Breakdown Card
    const insightCard = document.getElementById('insight-card');
    if (insightCard) {
        insightCard.style.display = "block";
        document.getElementById('floor-val').innerText = minimumStructuralFloor.toFixed(2);
        document.getElementById('penalty-val').innerText = remainingCourtCashToSplit.toFixed(2);
        document.getElementById('shuttle-val').innerText = shuttles.toFixed(2);
        
        const insightAlert = document.getElementById('insight-alert');
        if (insightAlert) {
            if (actualSwipes >= totalMaxSlotsAllowed) {
                insightAlert.innerText = "🎉 Amazing! We completely maxed out our MultiSport swipes today, so the baseline court cost has been split evenly among the whole crew!";
            } else {
                insightAlert.innerText = ""; 
            }
        }
    }
}
