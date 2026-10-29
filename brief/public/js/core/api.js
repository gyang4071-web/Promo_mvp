// Обращения к серверу. Ключи сервисов живут только на сервере.

export class ApiError extends Error {
  constructor(code, status, details) {
    super(code);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function postJson(url, body) {
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError('network', 0);
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* пустой ответ */
  }
  if (!res.ok || !data || data.ok !== true) {
    throw new ApiError((data && data.error) || 'server', res.status, data && data.details);
  }
  return data;
}

export function submitBrief(payload) {
  return postJson('/api/submit', payload);
}

// Загружает файл: сервер выдаёт подписанную ссылку, файл уходит прямо в хранилище.
export async function uploadFile(file, submissionId, onProgress) {
  const ticket = await postJson('/api/upload-url', {
    submissionId,
    name: file.name,
    size: file.size,
  });

  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', ticket.uploadUrl);
    xhr.setRequestHeader('Content-Type', ticket.contentType);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress && onProgress(e.loaded / e.total);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new ApiError('upload', xhr.status)));
    xhr.onerror = () => reject(new ApiError('network', 0));
    xhr.send(file);
  });

  return { path: ticket.path, name: file.name, size: file.size };
}
