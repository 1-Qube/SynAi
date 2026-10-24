export const LANGS = {
  en: {
    name: 'English',
    notFound: 'NOT FOUND IN CORPUS',
    noDocs: 'No documents are in scope. Include at least one indexed document before executing a query.',
    noMatch: (query) => `The selected documents do not contain indexed text matching "${query}".`,
    notFoundSummary: (query) => `No indexed passage in the selected documents answers: "${query}".`,
    abstain: 'ABSTAINED: SynAI will not infer a technical limit that is not present in the selected documents. Upload the governing manual or widen the corpus scope.',
    conflict: 'PARAMETER CONFLICT DETECTED',
    evidence: 'EVIDENCE BOUND',
    extractive: 'EXTRACTIVE EVIDENCE ONLY',
    action: 'ACTION REQUIRED: Conflicting values were found across the selected documents. Open each citation and reconcile the governing setpoint before use.',
    modelNote: (error) => `MODEL NOTE: ${error}. Showing retrieved excerpts only.`,
    trace: 'VERIFICATION TRACE: Open the citation badges to inspect the verbatim page excerpt. No value was added beyond those excerpts.',
    retrieved: (count, query) => `Retrieved ${count} passage(s) from the selected documents for "${query}".`,
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
    notFound: 'НЕ НАЙДЕНО В КОРПУСЕ',
    noDocs: 'В области запроса нет документов. Включите хотя бы один проиндексированный документ.',
    noMatch: (query) => `В выбранных документах нет проиндексированного текста по запросу «${query}».`,
    notFoundSummary: (query) => `В выбранных документах нет фрагмента, который отвечает на запрос: «${query}».`,
    abstain: 'ОТКАЗ: SynAI не выводит технический предел, которого нет в выбранных документах. Загрузите руководящий документ или расширьте область корпуса.',
    conflict: 'ОБНАРУЖЕНО РАСХОЖДЕНИЕ ПАРАМЕТРОВ',
    evidence: 'ОТВЕТ ПРИВЯЗАН К ТЕКСТУ',
    extractive: 'ТОЛЬКО ИЗВЛЕЧЁННЫЕ ФРАГМЕНТЫ',
    action: 'ТРЕБУЕТСЯ ДЕЙСТВИЕ: в выбранных документах найдены расходящиеся значения. Откройте ссылки и сверьте управляющую уставку перед применением.',
    modelNote: (error) => `ЗАМЕТКА МОДЕЛИ: ${error}. Показаны только извлечённые фрагменты.`,
    trace: 'СЛЕД ПРОВЕРКИ: откройте значки ссылок и сверьте дословный фрагмент страницы. Значения вне этих фрагментов не добавлялись.',
    retrieved: (count, query) => `Из выбранных документов извлечено фрагментов: ${count}. Запрос: «${query}».`,
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
    notFound: 'КОРПУСТА ТАПЫЛМАДЫ',
    noDocs: 'Сұрау ауқымында құжат жоқ. Кемінде бір индекстелген құжатты қосыңыз.',
    noMatch: (query) => `Таңдалған құжаттарда «${query}» сұранысына сәйкес индекстелген мәтін жоқ.`,
    notFoundSummary: (query) => `Таңдалған құжаттарда мына сұраққа жауап беретін үзінді жоқ: «${query}».`,
    abstain: 'БАСТАРТУ: SynAI таңдалған құжаттарда жоқ техникалық шекті шығармайды. Басшылық құжатты жүктеңіз немесе корпус ауқымын кеңейтіңіз.',
    conflict: 'ПАРАМЕТР ҚАЙШЫЛЫҒЫ ТАБЫЛДЫ',
    evidence: 'ЖАУАП МӘТІНГЕ БАЙЛАНДЫ',
    extractive: 'ТЕК ШЫҒАРЫЛҒАН ҮЗІНДІЛЕР',
    action: 'ӘРЕКЕТ ҚАЖЕТ: таңдалған құжаттарда айырмашылықты мәндер табылды. Қолданар алдында дәйексөздерді ашып, басшылық тағайындауды салыстырыңыз.',
    modelNote: (error) => `МОДЕЛЬ ЕСКЕРТПЕСІ: ${error}. Тек шығарылған үзінділер көрсетілді.`,
    trace: 'ТЕКСЕРУ ІЗІ: дәйексөз белгілерін ашып, беттің сөзбе-сөз үзіндісін қараңыз. Осы үзінділерден тыс мән қосылмады.',
    retrieved: (count, query) => `Таңдалған құжаттардан ${count} үзінді шығарылды. Сұрау: «${query}».`,
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
