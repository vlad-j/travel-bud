import * as FileSystem from 'expo-file-system/legacy';

export interface ParsedAccommodation {
  name?: string;
  platform?: string;
  address?: string;
  checkIn?: string;
  checkOut?: string;
  price?: string;
  bookingReference?: string;
  nights?: string;
}

export async function parseBookingPDF(fileUri: string): Promise<ParsedAccommodation> {
  try {
const base64 = await FileSystem.readAsStringAsync(fileUri, {
  encoding: 'base64' as any,
});

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: base64,
                },
              },
              {
                type: 'text',
                text: `Extract accommodation booking details from this PDF. Return ONLY a JSON object with these fields (use null if not found):
{
  "name": "property name",
  "platform": "Airbnb/Booking.com/Agoda/Other",
  "address": "full address",
  "checkIn": "date and time of check-in",
  "checkOut": "date and time of check-out",
  "price": "total price with currency",
  "bookingReference": "booking reference/confirmation number",
  "nights": "number of nights"
}`,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error('PDF parsing error:', e);
    return {};
  }
}