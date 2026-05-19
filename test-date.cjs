const { parse, isValid } = require('date-fns');
const d1 = parse("15/04/2026", 'dd/MM/yy', new Date());
console.log(d1, isValid(d1));
