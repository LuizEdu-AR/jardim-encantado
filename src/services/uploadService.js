import { auth } from './firebase';

export async function uploadImage(file) {
  if (!file) return '';
  if (!file.type.startsWith('image/')) throw new Error('Selecione uma imagem válida.');
  if (file.size > 5 * 1024 * 1024) throw new Error('A imagem deve ter no máximo 5 MB.');

  const token = await auth?.currentUser?.getIdToken();
  if (!token) throw new Error('Entre na sua conta antes de enviar imagens.');

  const signedResponse = await fetch('/api/cloudinary-sign', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const signed = await signedResponse.json();
  if (!signedResponse.ok) throw new Error(signed.error || 'Falha na autorização do upload.');

  const data = new FormData();
  data.append('file', file);
  data.append('api_key', signed.apiKey);
  data.append('timestamp', String(signed.timestamp));
  data.append('folder', signed.folder);
  data.append('signature', signed.signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`, {
    method: 'POST',
    body: data,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || 'Falha no envio da imagem.');
  return result.secure_url;
}
