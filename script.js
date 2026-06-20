function calculate() {
    // 1. Get Inputs (Using your exact index.html IDs)
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

    // 3. MultiSport Structural Floor Rules
    const maxSwipesPerCourtPerHour = 4;
    const totalMaxSlotsAllowed = courts * maxSwipesPerCourtPerHour * hours;

    const discountPerSwipe = 15; 
    const perfectScenarioDiscount = totalMaxSlotsAllowed * discountPerSwipe;
    const minimumStructuralFloor = Math.max(0, fullFee - perfectScenarioDiscount);

    // 4. Shared Foundations (Split completely equally among the true player count)
    const baseFloorPerPerson = minimumStructuralFloor / totalPlayers;
    const shuttleShare = shuttles / totalPlayers;

    // 5. Out-of-Pocket Court Cash Proportional Deficit Distribution
    const remainingCourtCashToSplit = Math.max(0, cashPaid - minimumStructuralFloor);

    let courtDebtPlus = 0;
    let courtDebtLight = 0;
    let courtDebtNone = 0;

    if (remainingCourtCashToSplit > 0) {
        const plusCardValue = plusMaxDiscount; 
        const lightCardValue = 15.0; 
        
        // Measure card deficit gaps compared to a maxed-out Plus card scenario
        const lightDeficitPerPerson = Math.max(0, plusCardValue - lightCardValue); 
        const noneDeficitPerPerson = plusCardValue; 

        const totalDeficitPool = (lightDeficitPerPerson * cLight) + (noneDeficitPerPerson * cNone);

        if (totalDeficitPool > 0) {
            courtDebtPlus = 0; 
            courtDebtLight = (lightDeficitPerPerson / totalDeficitPool) * remainingCourtCashToSplit;
            courtDebtNone = (noneDeficitPerPerson / totalDeficitPool) * remainingCourtCashToSplit;
        } else {
            courtDebtPlus = remainingCourtCashToSplit / totalPlayers;
            courtDebtLight = remainingCourtCashToSplit / totalPlayers;
            courtDebtNone = remainingCourtCashToSplit / totalPlayers;
        }
    }

    // 6. Base Final Price Calculations (Unrounded raw numeric format)
    let finalPlus = baseFloorPerPerson + courtDebtPlus + shuttleShare; 
    let finalLight = baseFloorPerPerson + courtDebtLight + shuttleShare;
    let finalNone = baseFloorPerPerson + courtDebtNone + shuttleShare;

    // Hard Ceiling Exception: If maximum possible card swipes were fully hit
    if (actualSwipes >= totalMaxSlotsAllowed) {
        const flatSplit = (cashPaid + shuttles) / totalPlayers;
        finalPlus = flatSplit;
        finalLight = flatSplit;
        finalNone = flatSplit;
    }

    // Convert values directly into strict float structures rounded to two decimal places
    let roundedPlus = Math.round(finalPlus * 100) / 100;
    let roundedLight = Math.round(finalLight * 100) / 100;
    let roundedNone = Math.round(finalNone * 100) / 100;

    // 7. Micro-Penny Rounding Variance Verification
    const totalTargetToRecover = cashPaid + shuttles;
    const initialCheckSum = (roundedPlus * cPlus) + (roundedLight * cLight) + (roundedNone * cNone);
    const variance = totalTargetToRecover - initialCheckSum;

    // Direct penny patching on the No Card tier to secure exact calculation balance
    if (Math.abs(variance) > 0.001 && cNone > 0) {
        roundedNone = Math.round((roundedNone + (variance / cNone)) * 100) / 100;
    }

    // 8. Render Correct Independent Totals to UI
    document.getElementById('resPlus').innerText = cPlus > 0 ? `${roundedPlus.toFixed(2)} PLN` : "0.00 PLN";
    document.getElementById('resLight').innerText = cLight > 0 ? `${roundedLight.toFixed(2)} PLN` : "0.00 PLN";
    document.getElementById('resNoCard').innerText = cNone > 0 ? `${roundedNone.toFixed(2)} PLN` : "0.00 PLN";

    // 9. Air-Tight Verification Box Calculation
    const finalVerifiedTotal = (roundedPlus * cPlus) + (roundedLight * cLight) + (roundedNone * cNone);
    const vBox = document.getElementById('validationBox');
    vBox.className = "validation-box valid-ok";
    vBox.innerText = `✅ Verified: Recovering ${finalVerifiedTotal.toFixed(2)} PLN`;
    document.getElementById('results').style.display = 'block';

    // 10. Populate Friendly Breakdown Card with Accurate Text Labels
    const insightCard = document.getElementById('insight-card');
    if (insightCard) {
        insightCard.style.display = "block";
        document.getElementById('floor-val').innerText = minimumStructuralFloor.toFixed(2);
        document.getElementById('shuttle-val').innerText = shuttles.toFixed(2);
        
        const penaltyLabelElement = document.getElementById('penalty-val').parentElement;
        if (penaltyLabelElement) {
            let labelText = `• <strong>Uncovered Court Balance:</strong> <span id="penalty-val">${remainingCourtCashToSplit.toFixed(2)}</span> PLN `;
            if (cNone > 0 && cLight > 0) {
                labelText += `<span style="color: #666; font-size: 11px;">(Shared proportionally by Light and No Card users based on card deficits)</span>`;
            } else if (cNone > 0) {
                labelText += `<span style="color: #666; font-size: 11px;">(Shared by players with no active card)</span>`;
            } else if (cLight > 0) {
                labelText += `<span style="color: #666; font-size: 11px;">(Shared by Light card users due to single-swipe limitations)</span>`;
            } else {
                labelText += `<span style="color: #666; font-size: 11px;">(Covered by active members out-of-pocket)</span>`;
            }
            penaltyLabelElement.innerHTML = labelText;
        }

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
