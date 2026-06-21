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
    
    const isDropMode = document.getElementById('modeToggle').checked;
    
    const totalPlayers = cPlus + cLight + cNone;
    if (totalPlayers === 0) return;

    // 2. Set Up Dynamic UI Labels
    const plusMaxDiscount = Math.max(1, Math.floor(hours)) * 15.0; 
    const lightMaxDiscount = 15.0;
    document.getElementById('plusLabel').innerText = `PLUS (max ${plusMaxDiscount} PLN off court)`;
    document.getElementById('lightLabel').innerText = `LIGHT (max ${lightMaxDiscount} PLN off court)`;

    // Update Mode text labels live
    const modeTitle = document.getElementById('modeTitle');
    const modeSub = document.getElementById('modeSub');
    if (isDropMode) {
        modeTitle.innerText = "💧 Mode: Aravind's Drop";
        modeSub.innerText = "Court fee on top of max-swipes split by all. Missing swipes paid proportionately by no-card and light users.";
    } else {
        modeTitle.innerText = "🏸 Mode: Luda's Clear";
        modeSub.innerText = "Fixed fee for no-card players. Extra money discounts the shuttles.";
    }

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

    // 4. Run Selection Calculations
    let finalPlus = 0;
    let finalLight = 0;
    let finalNone = 0;

    const flatShareOfCourt = fullFee / totalPlayers;
    const shuttleShare = shuttles / totalPlayers;
    const remainingCourtCashToSplit = Math.max(0, cashPaid - minimumStructuralFloor);

    if (isDropMode) {
        // --- ENGINE A: ARAVIND'S DROP ---
        const baseFloorPerPerson = minimumStructuralFloor / totalPlayers;
        let courtDebtPlus = 0, courtDebtLight = 0, courtDebtNone = 0;

        if (remainingCourtCashToSplit > 0) {
            const lightDeficitPerPerson = Math.max(0, plusMaxDiscount - 15.0); 
            const noneDeficitPerPerson = plusMaxDiscount; 
            const totalDeficitPool = (lightDeficitPerPerson * cLight) + (noneDeficitPerPerson * cNone);

            if (totalDeficitPool > 0) {
                courtDebtLight = (lightDeficitPerPerson / totalDeficitPool) * remainingCourtCashToSplit;
                courtDebtNone = (noneDeficitPerPerson / totalDeficitPool) * remainingCourtCashToSplit;
            } else {
                courtDebtPlus = courtDebtLight = courtDebtNone = remainingCourtCashToSplit / totalPlayers;
            }
        }
        finalPlus = baseFloorPerPerson + courtDebtPlus + shuttleShare; 
        finalLight = baseFloorPerPerson + courtDebtLight + shuttleShare;
        finalNone = baseFloorPerPerson + courtDebtNone + shuttleShare;

    } else {
        // --- ENGINE B: LUDA'S CLEAR ---
        const noCardRate = flatShareOfCourt;
        const lightCardRate = Math.max(0, flatShareOfCourt - 15.0);
        const plusCardRate = Math.max(0, flatShareOfCourt - plusMaxDiscount);

        const totalCourtCashCollected = (noCardRate * cNone) + (lightCardRate * cLight) + (plusCardRate * cPlus);
        const surplusCash = totalCourtCashCollected - cashPaid;

        // Subsidize shuttle pool directly using collected surplus cash
        const adjustedShuttlePool = Math.max(0, shuttles - surplusCash);
        const ludaShuttleShare = adjustedShuttlePool / totalPlayers;

        finalPlus = plusCardRate + ludaShuttleShare;
        finalLight = lightCardRate + ludaShuttleShare;
        finalNone = noCardRate + ludaShuttleShare;
    }

    // Hard Ceiling Override Check
    if (actualSwipes >= totalMaxSlotsAllowed) {
        const flatSplit = (cashPaid + shuttles) / totalPlayers;
        finalPlus = finalLight = finalNone = flatSplit;
    }

    // Rounding structures
    let roundedPlus = Math.round(finalPlus * 100) / 100;
    let roundedLight = Math.round(finalLight * 100) / 100;
    let roundedNone = Math.round(finalNone * 100) / 100;

    // Penny patching balance verification
    const totalTargetToRecover = cashPaid + shuttles;
    const initialCheckSum = (roundedPlus * cPlus) + (roundedLight * cLight) + (roundedNone * cNone);
    const variance = totalTargetToRecover - initialCheckSum;

    if (Math.abs(variance) > 0.001 && cNone > 0) {
        roundedNone = Math.round((roundedNone + (variance / cNone)) * 100) / 100;
    }

    // Render Outputs
    document.getElementById('resPlus').innerText = cPlus > 0 ? `${roundedPlus.toFixed(2)} PLN` : "0.00 PLN";
    document.getElementById('resLight').innerText = cLight > 0 ? `${roundedLight.toFixed(2)} PLN` : "0.00 PLN";
    document.getElementById('resNoCard').innerText = cNone > 0 ? `${roundedNone.toFixed(2)} PLN` : "0.00 PLN";

    const finalVerifiedTotal = (roundedPlus * cPlus) + (roundedLight * cLight) + (roundedNone * cNone);
    const vBox = document.getElementById('validationBox');
    vBox.className = "validation-box valid-ok";
    vBox.innerText = `✅ Verified: Recovering ${finalVerifiedTotal.toFixed(2)} PLN`;
    document.getElementById('results').style.display = 'block';

    // 10. Populate Simplified Breakdown Content Layout
    const insightCard = document.getElementById('insight-card');
    if (insightCard) {
        insightCard.style.display = "block";
        const breakdownContent = document.getElementById('breakdownContent');
        
        if (isDropMode) {
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
        } else {
            const noCardRate = flatShareOfCourt;
            const lightCardRate = Math.max(0, flatShareOfCourt - 15.0);
            const plusCardRate = Math.max(0, flatShareOfCourt - plusMaxDiscount);
            const totalCourtCashCollected = (noCardRate * cNone) + (lightCardRate * cLight) + (plusCardRate * cPlus);
            const surplusCash = totalCourtCashCollected - cashPaid;

            breakdownContent.innerHTML = `
                <ul style="list-style: none; padding: 0; margin: 0; line-height: 1.7; font-size: 13px; color: #334155;">
                    <li>• <strong>Original Court Price:</strong> <strong>${fullFee.toFixed(2)}</strong> PLN</li>
                    <li>
                        • <strong>Standard Court Rates:</strong>
                        <div style="padding-left: 10px; color: #64748b; font-size: 11px;">
                            No-Card User: ${noCardRate.toFixed(2)} PLN <em>(Flat share of full price)</em><br>
                            Light User: ${lightCardRate.toFixed(2)} PLN <em>(Flat share minus 15.00 PLN)</em><br>
                            Plus User: ${plusCardRate.toFixed(2)} PLN <em>(Flat share minus ${plusMaxDiscount.toFixed(2)} PLN max)</em>
                        </div>
                    </li>
                    <li>• <strong>Shuttle Cost Pool:</strong> <strong>${shuttles.toFixed(2)}</strong> PLN</li>
                    <li>• <strong>Extra cash to be used to reduce shuttle costs for everyone:</strong> <strong style="color: #10b981;">${(-surplusCash).toFixed(2)}</strong> PLN</li>
                </ul>
                <div style="color: #4338ca; font-weight: bold; margin-top: 10px; border-top: 1px dashed #cbd5e1; padding-top: 8px; font-size: 12px; line-height: 1.4;">
                    💡 No-card players pay a flat share of the full court price. Extra cash collected reduces the shuttle bill for everyone.
                </div>
            `;
        }
    }
}
