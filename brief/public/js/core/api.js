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

  // Отправляем так же, как официальный клиент Supabase: multipart с типом файла,
  // который выбрал сервер (браузеры часто не знают тип для .heic, .ai, .psd и т. п.).
  const body = new FormData();
  body.append('cacheControl', '3600');
  body.append('', new File([file], file.name, { type: ticket.contentType }));

  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', ticket.uploadUrl);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let reason = '';
      try {
        reason = JSON.parse(xhr.responseText).message || '';
      } catch {
        /* без подробностей */
      }
      reject(new ApiError('upload', xhr.status, reason));
    };
    xhr.onerror = () => reject(new ApiError('network', 0));
    xhr.send(body);
  });

  return { path: ticket.path, name: file.name, size: file.size };
}
