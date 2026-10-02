// Seeds demo warranty claims for the invoice validator app (Irish dealers, EUR).
// Safe to run repeatedly: existing claims (by claimNo) are updated, missing ones are created.
// claimAmount = total incl. 23 % VAT of the matching test invoice.

const VIN_MAIN = '2AYNE7APXR3T10229';
const CURRENCY = 'EUR';

const claims = [
    {
        claimNo: 'DEMO-2026-0713', status: 'Submitted', claimDate: '2026-09-21',
        dealerName: 'Liffey Valley Motors', customerName: 'Olivia Martin',
        vehicleMake: 'Toyota', vehicleModel: 'RAV4 Hybrid', vehicleYear: 2024, vin: VIN_MAIN, odometerKm: 18450,
        currency: CURRENCY, claimAmount: 904.05,
        causalPart: 'Front shock absorber assembly',
        faultDescription: 'Front suspension knocking; shock absorber leaking',
        defectCode: 'SUSPENSION', troubleCode: ''
    },
    {
        claimNo: 'DEMO-2026-0721', status: 'Submitted', claimDate: '2026-09-22',
        dealerName: 'Long Mile Auto Centre', customerName: 'Liam Chen',
        vehicleMake: 'Honda', vehicleModel: 'Accord', vehicleYear: 2023, vin: '1HGCM82633A004352', odometerKm: 32110,
        currency: CURRENCY, claimAmount: 590.40,
        causalPart: 'Front brake rotors and pads',
        faultDescription: 'Brake judder and grinding noise when braking',
        defectCode: 'BRAKES', troubleCode: ''
    },
    {
        claimNo: 'DEMO-2026-0734', status: 'In review', claimDate: '2026-09-24',
        dealerName: 'Santry Auto Electrical', customerName: 'Olivia Martin',
        vehicleMake: 'Toyota', vehicleModel: 'RAV4 Hybrid', vehicleYear: 2024, vin: VIN_MAIN, odometerKm: 18920,
        currency: CURRENCY, claimAmount: 466.17,
        causalPart: '12V auxiliary battery',
        faultDescription: 'Vehicle does not start; 12V battery not holding charge',
        defectCode: 'ELECTRICAL', troubleCode: 'P0562'
    },
    {
        claimNo: 'DEMO-2026-0742', status: 'Submitted', claimDate: '2026-09-25',
        dealerName: 'Naas Road Tyre & Service', customerName: 'Olivia Martin',
        vehicleMake: 'Toyota', vehicleModel: 'RAV4 Hybrid', vehicleYear: 2024, vin: VIN_MAIN, odometerKm: 19100,
        currency: CURRENCY, claimAmount: 257.07,
        causalPart: 'Wheel alignment / steering geometry',
        faultDescription: 'Vehicle pulling to the left; uneven front tyre wear',
        defectCode: 'STEERING', troubleCode: ''
    },
    {
        claimNo: 'DEMO-2026-0758', status: 'Submitted', claimDate: '2026-09-27',
        dealerName: 'Liffey Valley Motors', customerName: 'Noah Williams',
        vehicleMake: 'Mazda', vehicleModel: 'CX-5', vehicleYear: 2025, vin: 'JM3KFBDM1R0412873', odometerKm: 6400,
        currency: CURRENCY, claimAmount: 381.30,
        causalPart: 'Smart keyfob',
        faultDescription: 'Keyfob not detected; doors do not unlock',
        defectCode: 'ELECTRICAL', troubleCode: 'B2785'
    }
];

const saved = [];
for (const claim of claims) {
    const existing = await entities.genai_claim.findOne({ where: { claimNo: claim.claimNo } });
    const row = existing ? { ...existing, ...claim } : claim;
    await entities.genai_claim.save(row);
    saved.push(`${claim.claimNo} ${existing ? 'updated' : 'created'}`);
}

log.info('Demo claims seeded:', saved);
result.data = { seeded: saved };
