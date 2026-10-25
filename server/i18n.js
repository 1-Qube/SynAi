export const LANGS = {
  en: {
    name: 'English',
    notFound: 'Not in the documents',
    noDocs: 'No documents are selected. Upload or include a document before asking.',
    noMatch: (query) => `The selected documents do not specify an answer to: "${query}".`,
    notFoundSummary: (query) => `The selected documents do not specify this. Nothing in the indexed pages answers: "${query}".`,
    answeredFromDocs: 'Answered from the selected documents.',
    abstain: 'SynAI will not infer a technical limit that is not written in the selected documents.',
    conflict: 'PARAMETER CONFLICT DETECTED',
    evidence: 'EVIDENCE BOUND',
    extractive: '',
    action: 'Conflicting values were found. Open each citation and confirm the governing value before use.',
    modelNote: () => '',
    trace: '',
    retrieved: () => '',
    retrievedLead: 'Retrieved from',
    noAdded: 'No generated number was added:',
    passage: 'Passage retrieved for',
    page: 'Page',
    family: {
      temperature: 'Temperature setpoint mismatch',
      pressure: 'Pressure setpoint mismatch',
      torque: 'Torque setpoint mismatch',
      resistance: 'Resistance setpoint mismatch',
      time: 'Time setpoint mismatch'
    }
  },
  ru: {
    name: 'Russian',
    notFound: 'В документах нет',
    noDocs: 'Документы не выбраны. Загрузите или включите документ.',
    noMatch: (query) => `Выбранные документы не содержат ответ на запрос: «${query}».`,
    notFoundSummary: (query) => `В выбранных документах это не указано. Нет сведений по запросу: «${query}».`,
    answeredFromDocs: 'Ответ составлен по выбранным документам.',
    abstain: 'ОТКАЗ: SynAI не выводит технический предел, которого нет в выбранных документах. Загрузите руководящий документ или расширьте область корпуса.',
    conflict: 'ОБНАРУЖЕНО РАСХОЖДЕНИЕ ПАРАМЕТРОВ',
    evidence: 'ОТВЕТ ПРИВЯЗАН К ТЕКСТУ',
    extractive: '',
    action: 'Найдены расходящиеся значения. Откройте ссылки и сверьте управляющее значение перед применением.',
    modelNote: () => '',
    trace: '',
    retrieved: () => '',
    retrievedLead: 'Извлечено из',
    noAdded: 'Сгенерированное число не добавлялось:',
    passage: 'Фрагмент извлечён для',
    page: 'Стр.',
    family: {
      temperature: 'Расхождение уставки температуры',
      pressure: 'Расхождение уставки давления',
      torque: 'Расхождение уставки момента',
      resistance: 'Расхождение уставки сопротивления',
      time: 'Расхождение уставки времени'
    }
  },
  kk: {
    name: 'Kazakh',
    notFound: 'Құжатта жоқ',
    noDocs: 'Құжат таңдалмаған. Құжатты жүктеңіз немесе қосыңыз.',
    noMatch: (query) => `Таңдалған құжаттар «${query}» сұрағына жауап бермейді.`,
    notFoundSummary: (query) => `Таңдалған құжаттарда бұл көрсетілмеген. Сұрау: «${query}».`,
    answeredFromDocs: 'Жауап таңдалған құжаттар бойынша құрылды.',
    abstain: 'БАСТАРТУ: SynAI таңдалған құжаттарда жоқ техникалық шекті шығармайды. Басшылық құжатты жүктеңіз немесе корпус ауқымын кеңейтіңіз.',
    conflict: 'ПАРАМЕТР ҚАЙШЫЛЫҒЫ ТАБЫЛДЫ',
    evidence: 'ЖАУАП МӘТІНГЕ БАЙЛАНДЫ',
    extractive: '',
    action: 'Қайшы мәндер табылды. Қолданар алдында дәйексөздерді ашып, басшы мәнді салыстырыңыз.',
    modelNote: () => '',
    trace: '',
    retrieved: () => '',
    retrievedLead: 'Шығарылған дереккөз',
    noAdded: 'Жасалған сан қосылмады:',
    passage: 'Үзінді мына сұрау үшін шығарылды',
    page: 'Бет',
    family: {
      temperature: 'Температура тағайындауының қайшылығы',
      pressure: 'Қысым тағайындауының қайшылығы',
      torque: 'Момент тағайындауының қайшылығы',
      resistance: 'Кедергі тағайындауының қайшылығы',
      time: 'Уақыт тағайындауының қайшылығы'
    }
  }
};

export function copyFor(language) {
  return LANGS[language] || LANGS.en;
}
