import crypto from 'node:crypto';
import { getAdmin, reject } from './_admin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
  try {
    const bearer = req.headers.authorization || '';
    if (!bearer.startsWith('Bearer ')) throw new Error('Token ausente.');
    const sdk = getAdmin();
    const decoded = await sdk.auth().verifyIdToken(bearer.slice(7), true);
    const userDoc = await sdk.firestore().collection('users').doc(decoded.uid).get();
    if (!userDoc.exists) throw new Error('Cadastro não encontrado.');
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) return res.status(503).json({ error: 'Cloudinary não configurado.' });
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'jardim-encantado';
    const signature = crypto.createHash('sha1').update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`).digest('hex');
    return res.status(200).json({ cloudName, apiKey, timestamp, folder, signature });
  } catch (error) { return reject(res, error); }
}
