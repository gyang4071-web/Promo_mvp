// Структура брифа. Здесь меняются этапы, вопросы, поля и варианты ответов.
// Тексты лежат отдельно, в locales/<язык>.js, по тем же id.
// Этот файл используется и в браузере, и на сервере (проверка + письмо).

export const BRIEF_VERSION = 1;

// Типы полей: text, textarea, url, email, tel, choice, links, files.
// required: true — поле обязательно. Вопрос без обязательных полей помечается «Необязательно».
export const STEPS = [
  {
    id: 'brand',
    questions: [
      {
        id: 'q1',
        fields: [
          { id: 'company', type: 'text', required: true, autocomplete: 'organization' },
          { id: 'product', type: 'textarea', required: true },
          { id: 'website', type: 'url', required: true },
        ],
      },
      { id: 'q2', fields: [{ id: 'advantages', type: 'textarea', required: true }] },
    ],
  },
  {
    id: 'goal',
    questions: [
      {
        id: 'q3',
        fields: [
          {
            id: 'goals',
            type: 'choice',
            multiple: true,
            required: true,
            options: ['introduce', 'explain', 'benefits', 'doubts', 'compare'],
            other: true,
          },
        ],
      },
      { id: 'q4', fields: [{ id: 'keyMessage', type: 'textarea', required: true }] },
    ],
  },
  {
    id: 'audience',
    questions: [
      { id: 'q5', fields: [{ id: 'audience', type: 'textarea', required: true }] },
      { id: 'q6', fields: [{ id: 'barriers', type: 'textarea', required: true }] },
    ],
  },
  {
    id: 'content',
    questions: [
      { id: 'q7', fields: [{ id: 'features', type: 'textarea', required: true }] },
      {
        id: 'q8',
        fields: [
          { id: 'facts', type: 'textarea' },
          { id: 'factLinks', type: 'links' },
        ],
      },
    ],
  },
  {
    id: 'action',
    questions: [
      {
        id: 'q9',
        fields: [
          {
            id: 'cta',
            type: 'choice',
            multiple: false,
            required: true,
            options: ['visit', 'signup', 'lead', 'purchase', 'consultation'],
            other: true,
          },
          { id: 'landingUrl', type: 'url' },
        ],
      },
      { id: 'q10', fields: [{ id: 'offer', type: 'textarea' }] },
    ],
  },
  {
    id: 'materials',
    questions: [
      { id: 'q12', fields: [{ id: 'restrictions', type: 'textarea' }] },
    ],
  },
  {
    id: 'extra',
    questions: [{ id: 'q13', fields: [{ id: 'additionalInfo', type: 'textarea' }] }],
  },
];

export const SECTIONS = STEPS;

// Ограничения длины (символы) и списков.
export const LIMITS = {
  text: 200,
  textarea: 5000,
  url: 2000,
  email: 254,
  tel: 40,
  other: 500,
  links: 10,
};

// Файлы: проверяются в браузере, на сервере и в настройках хранилища.
export const FILE_RULES = {
  maxSize: 50 * 1024 * 1024,
  maxFiles: 10,
  types: {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',
    txt: 'text/plain',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    heic: 'image/heic',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    zip: 'application/zip',
    ai: 'application/postscript',
    eps: 'application/postscript',
    psd: 'image/vnd.adobe.photoshop',
  },
};

export function allFields(section) {
  return section.questions.flatMap((q) => q.fields);
}

export function isQuestionOptional(question) {
  return !question.fields.some((f) => f.required);
}
