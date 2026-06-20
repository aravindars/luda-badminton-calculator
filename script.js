function calculate() {
    // 1. Get Inputs (Using your exact existing IDs from index.html)
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

    // 2. Dynamic Labels setup (Kept original label functionality)
    const plusMaxDiscount = Math.max(1, Math.floor(hours)) * 15.0; 
    const lightMaxDiscount = 15.0;
    document.getElementById('plusLabel').innerText = `PLUS (max ${plusMaxDiscount} PLN off court)`;
    document.getElementById('lightLabel').innerText = `LIGHT (max ${lightMaxDiscount} PLN off court)`;

    // 3. MultiSport Structural Rule Calculations (Max 4 swipes per court per hour)
    const maxSwipesPerCourtPerHour = 4;
    const totalMaxSlotsAllowed = courts * maxSwipesPerCourtPerHour * hours;

    // Calculate minimum unavoidable cash floor (if all slots had been maxed out with Plus cards)
    const discountPerSwipe = 15; 
    const perfectScenarioDiscount = totalMaxSlotsAllowed * discountPerSwipe;
    const minimumStructuralFloor = Math.max(0, fullFee - perfectScenarioDiscount);

    // 4. Distribute that unavoidable base fee floor equally among EVERYONE
    const baseFloorPerPerson = minimumStructuralFloor / totalPlayers;

    // 5. Handle any remaining cash paid (uncovered court balance caused by missing cards)
    const remainingCashPenalty = Math.max(0, cashPaid - minimumStructuralFloor);
    const totalNoCardOrLightUsers = cLight + cNone; 

    let penaltyPerNoCardUser = 0;
    if (remainingCashPenalty > 0 && totalNoCardOrLightUsers > 0) {
        // Shared exclusively among those who couldn't scan a full Plus card
        penaltyPerNoCardUser = remainingCashPenalty / totalNoCardOrLightUsers;
    } else if (remainingCashPenalty > 0 && totalNoCardOrLightUsers === 0) {
        // Fallback if everyone is a Plus card user but the facility still required a cash remainder
        penaltyPerNoCardUser = remainingCashPenalty / totalPlayers;
    }

    // 6. Calculate even split for shuttles
    const shuttleShare = shuttles / totalPlayers;

    // 7. Final Individual Price Construction
    let cp = baseFloorPerPerson + shuttleShare; 
    let cl = baseFloorPerPerson + penaltyPerNoCardUser + shuttleShare;
    let cn = baseFloorPerPerson + penaltyPerNoCardUser + shuttleShare;

    // Clean Exception: If actual swipes hit or exceed the facility's hard ceiling, split flatly
    if (actualSwipes >= totalMaxSlotsAllowed) {
        const flatSplit = (cashPaid + shuttles) / totalPlayers;
        cp = flatSplit;
        cl = flatSplit;
        cn = flatSplit;
    }

    // 8. Update UI - Only show values if player count > 0 to avoid confusion
    document.getElementById('resPlus').innerText = cPlus > 0 ? cp.toFixed(2) + " PLN" : "0.00 PLN";
    document.getElementById('resLight').innerText = cLight > 0 ? cl.toFixed(2) + " PLN" : "0.00 PLN";
    document.getElementById('resNoCard').innerText = cNone > 0 ? cn.toFixed(2) + " PLN" : "0.00 PLN";

    // 9. Validation Box
    const totalCollected = (cp * cPlus) + (cl * cLight) + (cn * cNone);
    const vBox = document.getElementById('validationBox');
    vBox.className = "validation-box valid-ok";
    vBox.innerText = `✅ Verified: Recovering ${totalCollected.toFixed(2)} PLN`;
    document.getElementById('results').style.display = 'block';

    // 10. Dynamically populate the friendly breakdown card
    const insightCard = document.getElementById('insight-card');
    if (insightCard) {
        insightCard.style.display = "block";
        document.getElementById('floor-val').innerText = minimumStructuralFloor.toFixed(2);
        document.getElementById('penalty-val').innerText = remainingCashPenalty.toFixed(2);
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
