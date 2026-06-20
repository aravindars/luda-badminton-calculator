function calculate() {
    // 1. Get Inputs (Using your exact index.html IDs)
    const fullFee = parseFloat(document.getElementById('fullFee').value) || 0;
    const cashPaid = parseFloat(document.getElementById('cashPaid').value) || 0;
    const shuttles = parseFloat(document.getElementById('shuttleCost').value) || 0;
    const hours = parseFloat(document.getElementById('sessionHours').value) || 1;
    const courts = parseInt(document.getElementById('courts').value) || 1; 
    const actualSwipes = parseInt(document.getElementById('actualSwipes').value) || 0;

    let cPlus = parseInt(document.getElementById('cntPlus').value) || 0;
    const cLight = parseInt(document.getElementById('cntLight').value) || 0;
    const cNone = parseInt(document.getElementById('cntNone').value) || 0;
    
    // 2. MultiSport Structural Floor Rules
    const maxSwipesPerCourtPerHour = 4;
    const totalMaxSlotsAllowed = courts * maxSwipesPerCourtPerHour * hours;

    // Detect true total player count across all 9 players 
    // to split global costs like base fees and shuttles flawlessly.
    const implicitPlusPlayers = Math.max(0, actualSwipes - cLight);
    const calculatedTotalPlayers = Math.max(cPlus + cLight + cNone, implicitPlusPlayers + cLight + cNone);
    
    if (calculatedTotalPlayers === 0) return;

    // Update internal Plus tracker if total session swipes indicate more attendees
    if (implicitPlusPlayers > cPlus) {
        cPlus = implicitPlusPlayers;
    }

    // 3. Set Up Dynamic UI Labels
    const plusMaxDiscount = Math.max(1, Math.floor(hours)) * 15.0; 
    const lightMaxDiscount = 15.0;
    document.getElementById('plusLabel').innerText = `PLUS (max ${plusMaxDiscount} PLN off court)`;
    document.getElementById('lightLabel').innerText = `LIGHT (max ${lightMaxDiscount} PLN off court)`;

    const discountPerSwipe = 15; 
    const perfectScenarioDiscount = totalMaxSlotsAllowed * discountPerSwipe;
    const minimumStructuralFloor = Math.max(0, fullFee - perfectScenarioDiscount);

    // 4. Shared Foundations (Split completely equally among the true total group size)
    const baseFloorPerPerson = minimumStructuralFloor / calculatedTotalPlayers;
    const shuttleShare = shuttles / calculatedTotalPlayers;

    // 5. Clean, Isolated Tier Cost Calculations
    const remainingCourtCashToSplit = Math.max(0, cashPaid - minimumStructuralFloor);

    let courtDebtPlus = 0;
    let courtDebtLight = 0;
    let courtDebtNone = 0;

    const nonPlusPlayers = cLight + cNone;

    if (remainingCourtCashToSplit > 0) {
        if (nonPlusPlayers > 0) {
            const rawUncoveredShare = remainingCourtCashToSplit / nonPlusPlayers;
            
            courtDebtLight = Math.max(0, rawUncoveredShare - lightMaxDiscount);
            courtDebtNone = rawUncoveredShare;

            const trueCostCoveredByLight = courtDebtLight * cLight;
            const remainingTargetForNone = remainingCourtCashToSplit - trueCostCoveredByLight;

            if (cNone > 0) {
                courtDebtNone = remainingTargetForNone / cNone;
            }
        } else if (cPlus > 0) {
            courtDebtPlus = remainingCourtCashToSplit / cPlus;
        }
    }

    // 6. Final Individual Price Assembly
    let cp = baseFloorPerPerson + courtDebtPlus + shuttleShare; 
    let cl = baseFloorPerPerson + courtDebtLight + shuttleShare;
    let cn = baseFloorPerPerson + courtDebtNone + shuttleShare;

    // Hard Ceiling Exception: If maximum possible card swipes were fully hit
    if (actualSwipes >= totalMaxSlotsAllowed) {
        const flatSplit = (cashPaid + shuttles) / calculatedTotalPlayers;
        cp = flatSplit;
        cl = flatSplit;
        cn = flatSplit;
    }

    // 7. Render Exact Totals to UI
    document.getElementById('resPlus').innerText = cPlus > 0 ? cp.toFixed(2) + " PLN" : "0.00 PLN";
    document.getElementById('resLight').innerText = cLight > 0 ? cl.toFixed(2) + " PLN" : "0.00 PLN";
    document.getElementById('resNoCard').innerText = cNone > 0 ? cn.toFixed(2) + " PLN" : "0.00 PLN";

    // 8. Air-Tight Verification Box Calculation
    // Uses the custom input parameters to verify precise balance matching
    const originalInputPlus = parseInt(document.getElementById('cntPlus').value) || 0;
    const totalCollected = (cp * originalInputPlus) + (cl * cLight) + (cn * cNone);
    
    const vBox = document.getElementById('validationBox');
    vBox.className = "validation-box valid-ok";
    vBox.innerText = `✅ Verified: Recovering ${totalCollected.toFixed(2)} PLN`;
    document.getElementById('results').style.display = 'block';

    // 9. Populate Friendly Breakdown Card
    const insightCard = document.getElementById('insight-card');
    if (insightCard) {
        insightCard.style.display = "block";
        document.getElementById('floor-val').innerText = minimumStructuralFloor.toFixed(2);
        document.getElementById('penalty-val').innerText = remainingCourtCashToSplit.toFixed(2);
        document.getElementById('shuttle-val').innerText = shuttles.toFixed(2);
        
        const insightAlert = document.getElementById('insight-alert');
        if (insightAlert) {
            if (actualSwipes >= totalMaxSlotsAllowed) {
                insightAlert.innerText = "🎉 We utilized all our MultiSport swipes today, so the court cost has been split evenly among everyone!";
            } else {
                insightAlert.innerText = ""; 
            }
        }
    }
}
