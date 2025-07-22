const sheetID = '1RoYfcrgXSQTeuJBMaIAPA7SKJ10uc89M2sqtft6lcm4';
const sheetName = 'Sheet';
const url = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?sheet=${sheetName}`;
const table = {};

fetch(url)
    .then(res => res.text())
    .then(text => {
        const json = JSON.parse(text.substring(47).slice(0, -2));
        const rows = json.table.rows.map(row =>
            row.c.map(cell => cell?.f || cell?.v || null)
        );
        for (const row of rows) {
            const key = +row[0];
            if (!key) continue;
            table[key] = row.slice(1).map(cell => {
                if (cell === null) return cell;
                if (cell === '-') return 0.5;

                if (typeof cell === 'string') {
                    const normalized = cell.replace(',', '.');
                    const num = parseFloat(normalized);
                    return isNaN(num) ? cell : num;
                }

                return cell;
            });
        }
        document.getElementById('ok').classList.remove('disabled');
    });

document.getElementById('ok').addEventListener('click', () => {
    const ageInput = document.getElementById('moons');
    const traumaInput = document.getElementById('trauma');
    const resultDiv = document.getElementById('result');

    let age = parseInt(ageInput.value.replace(',', '.'));
    if (isNaN(age)) {
        if (ageInput.value === '') {
            resultDiv.innerText = `Вы не ввели возраст`;
        } else {
            resultDiv.innerText = `Некорректный возраст ('${ageInput.value}' лун)`;
        }
        return;
    }
    let trauma = parseInt(traumaInput.value.replace(',', '.'));
    if (isNaN(trauma)) {
        if (traumaInput.value === '') {
            resultDiv.innerText = `Вы не ввели количество здоровья`;
        } else {
            resultDiv.innerText = `Некорректный процент здоровья ('${traumaInput.value}%')`;
        }
        return;
    }

    const realAge = age;
    age = Math.max(5, Math.min(275, age));
    trauma = 100 - trauma;
    trauma = Math.max(1, Math.min(100, trauma));

    const result = table[age];
    if (result === undefined) {
        resultDiv.innerText = `Какой-то сложный возраст ('${age}' лун). Позвоните Тису`;
        return;
    }
    for (let i = 0; i < result.length; i++) {
        if (result[i] === null) {
            let k = 0;
            let replacement = null;
            while (replacement === null && k < 270) {
                k++;
                const check = table[age - k];
                if (check !== undefined && check[i] !== null) {
                    replacement = check[i];
                }
                const check2 = table[age + k];
                if (check2 !== undefined && check2[i] !== null) {
                    replacement = check2[i];
                }
            }
            result[i] = replacement;
        }
    }
    let maxAmount = 1;
    if (age >= 6)   maxAmount = 2;
    if (age >= 12)  maxAmount = 3;
    if (age >= 50)  maxAmount = 4;
    if (age >= 200) maxAmount = 5;
    const formatString = (hours, health) => {
        const days = Math.floor(hours / 24);
        hours -= days * 24;
        const time = (days > 0 ? `${days} ${declination(days, ['день', 'дня', 'дней'])} ` : ``) + `${hours} часов`;
        const amount = Math.ceil(trauma / (health * 100));
        const date = new Date();
        date.setHours(date.getHours() + hours + days * 24);
        const dDay = String(date.getDate()).padStart(2, '0');
        const dMonth = String(date.getMonth() + 1).padStart(2, '0'); // months are 0-based
        const dHours = String(date.getHours()).padStart(2, '0');
        const dMinutes = String(date.getMinutes()).padStart(2, '0');
        return {
            bsAmount: amount,
            time,
            dTime: `${dDay}.${dMonth} в ${dHours}:${dMinutes}`,
        };
    }
    let biggest = 0;
    let biggestHours = 6;
    resultDiv.innerHTML = `Для лечения ${trauma}% ушибов (${100 - trauma}% здоровья) в ${realAge} ${declination(realAge, ['луны', 'луны', 'лун'])} нужно надеть `;
    for (let i = 0; i < result.length; i++) {
        const now = result[i];
        let hours = (i + 1) * 0.25 * 24;
        if (now * 100 * maxAmount > trauma) {
            const data = formatString(hours, now);
            resultDiv.innerHTML += `<b>${data.bsAmount}</b> костоправ${declination(data.bsAmount, ['', 'а', 'ов'])} и носить <b>${data.time}</b> (если надеть сейчас, снимать надо <b>${data.dTime}</b>)`;
            return;
        }
        if (now > biggest) {
            biggest = now;
            biggestHours = hours;
        }
    }
    let hours = biggestHours;
    const data = formatString(hours, biggest);
    resultDiv.innerHTML = `<b>${data.bsAmount}</b> костоправ${declination(data.bsAmount, ['', 'а', 'ов'])} и носить <b>${data.time}</b> (если надеть сейчас, снимать надо <b>${data.dTime}</b>)<br>Лечение будет неполным! Вы слишком маленьковый для такого. <u><b>Вылечится ${biggest * 100}% здоровья.</b></u>`;
});
const declination = (count, types) => {
    const cases = [2, 0, 1, 1, 1, 2];
    let typeNum = (count % 100 > 4 && count % 100 < 20) ? 2 : cases[Math.min(count % 10, 5)];
    if (Math.floor(count) != count) typeNum = 1;
    return types[typeNum];
};