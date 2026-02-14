// API Configuration

// URL-ul Webhook-ului n8n
// TODO: Înlocuiește cu URL-ul real când ești gata
export const WEBHOOK_URL = 'https://asistentulmeu.space/webhook/save';

export interface DocumentData {
  car_info: string;
  doc_type: string;
  expiry_date: string;
  alert_email: string;
  alert_30_days: boolean;
  alert_7_days: boolean;
  alert_1_day: boolean;
}

/**
 * Trimite datele documentului către Webhook.
 * @param {DocumentData} data - Datele formularului
 * @returns {Promise<Response>}
 */
export async function saveDocument(data: DocumentData) {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error('Error sending data to webhook:', error);
    throw error;
  }
}
