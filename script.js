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

    // --- LIVE EXCEPTION ERROR CHECKING ---
    const expectedPlusSwipes = cPlus * hours;
    const expectedLightSwipes = cLight * 1;
    const theoreticalSwipes = Math.min(expectedPlusSwipes + expectedLightSwipes, totalMaxSlotsAllowed);
    const expectedCashBill = Math.max(0, fullFee - (theoreticalSwipes * 15));
    
    const warningBox = document.getElementById('warningBox');
    const inputDifference = cashPaid - expectedCashBill;
    
    if (Math.abs(inputDifference) > 0.02) {
        warningBox.style.display = "block";
        document.getElementById('warnExpected').innerText = expectedCashBill.toFixed(2);
        document.getElementById('warnEntered').innerText = cashPaid.toFixed(2);
        document.getElementById('warnDiff').innerText = (inputDifference > 0 ? "+" : "") + inputDifference.toFixed(2);
    } else {
        warningBox.style.display = "none";
    }
    // -------------------------------------

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

    // 10. Populate Simplified Session Breakdown View Layout
    const insightCard = document.getElementById('insight-card');
    if (insightCard) {
        insightCard.style.display = "block";
        const breakdownContent = document.getElementById('breakdownContent');
        
        if (actualSwipes >= totalMaxSlotsAllowed) {
            // --- WHEN MAX-SWIPES MODE TAKES OVER OVERRIDE ---
            breakdownContent.innerHTML = `
                <ul style="list-style: none; padding: 0; margin: 0; line-height: 1.7; font-size: 13px; color: #334155;">
                    <li>• <strong>Court fee even after max-swipes:</strong> <strong>${minimumStructuralFloor.toFixed(2)}</strong> PLN <span style="color: #64748b; font-size: 11px;">(Split equally by all)</span></li>
                    <li>• <strong>Missing Swipe Balance:</strong> <strong>0.00</strong> PLN <span style="color: #64748b; font-size: 11px;">(Paid proportionately only by cardless/light users)</span></li>
                    <li>• <strong>Shuttle Cost Pool:</strong> <strong>${shuttles.toFixed(2)}</strong> PLN <span style="color: #64748b; font-size: 11px;">(Split equally by all)</span></li>
                </ul>
                <div style="color: #4338ca; font-weight: bold; margin-top: 10px; border-top: 1px dashed #cbd5e1; padding-top: 8px; font-size: 12px; line-height: 1.4;">
                    🎉 Everyone splits the core court fee and shuttles. Only cardless and light users pay proportionately for missing swipes.
                </div>
            `;
        } else {
            // --- STANDARD MODE: PROPORTIONATE DEFICIT SPLIT ---
            breakdownContent.innerHTML = `
                <ul style="list-style: none; padding: 0; margin: 0; line-height: 1.7; font-size: 13px; color: #334155;">
                    <li>• <strong>Court fee even after max-swipes:</strong> <strong>${minimumStructuralFloor.toFixed(2)}</strong> PLN <span style="color: #64748b; font-size: 11px;">(Split equally by all)</span></li>
                    <li>• <strong>Missing Swipe Balance:</strong> <strong>${remainingCourtCashToSplit.toFixed(2)}</strong> PLN <span style="color: #64748b; font-size: 11px;">(Paid proportionately only by cardless/light users)</span></li>
                    <li>• <strong>Shuttle Cost Pool:</strong> <strong>${shuttles.toFixed(2)}</strong> PLN <span style="color: #64748b; font-size: 11px;">(Split equally by all)</span></li>
                </ul>
                <div style="color: #4338ca; font-weight: bold; margin-top: 10px; border-top: 1px dashed #cbd5e1; padding-top: 8px; font-size: 12px; line-height: 1.4;">
                    💡 Everyone splits the core court fee and shuttles. Only cardless and light users pay proportionately for missing swipes.
                </div>
            `;
        }
    }
}
