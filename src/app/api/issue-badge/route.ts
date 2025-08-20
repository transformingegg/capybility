import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { holderAddress, holderOcId } = await request.json();

    if (!holderAddress || !holderOcId) {
      return NextResponse.json({ error: 'Missing holder address or OCID' }, { status: 400 });
    }

    const apiKey = process.env.OC_STAGING_API_KEY;
    if (!apiKey) {
      throw new Error("OC_STAGING_API_KEY is not set in environment variables.");
    }

    // Construct the payload as per the documentation for OCB Issuance
    const credentialPayload = {
      validFrom: new Date().toISOString(),
      awardedDate: new Date().toISOString(),
      description: "Awarded for consistent demonstration on of knowledge and activity within Capybility that shows they are an Educhain Ecosystem Expert",
      credentialSubject: {
        type: "Person",
        image: "https://www.capybility.xyz/img/EduchainExpertPromo1300x1300.png", // URL to your badge image
        achievement: {
          name: "CAPYBILITY EDUCHAIN EXPERT", // This must match your badge submission form
          description: "Awarded for consistent demonstration on of knowledge and activity within Capybility that shows they are an Educhain Ecosystem Expert",
          achievementType: "Badge"
        },
      },
    };

    const body = {
      credentialPayload,
      collectionSymbol: "ocbadge",
      holderAddress: holderAddress, // Using wallet address as required for Yuzu points
    };

    const response = await fetch('https://api.vc.staging.opencampus.xyz/issuer/vc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify(body),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("Error from Open Campus API:", responseData);
      throw new Error(responseData.message || 'Failed to issue badge.');
    }

    return NextResponse.json({ success: true, data: responseData });

  } catch (error) {
    // We check if the caught object is an instance of Error to safely access its message property.
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    console.error("Error in /api/issue-badge:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}