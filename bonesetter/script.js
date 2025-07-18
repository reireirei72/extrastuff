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
        console.log(table);
    });

document.getElementById('ok').addEventListener('click', () => {
    const ageInput = document.getElementById('moons');
    const traumaInput = document.getElementById('trauma');
    const resultDiv = document.getElementById('result');

    let age = parseInt(ageInput.value.replace(',', '.'));
    if (isNaN(age)) {
        resultDiv.innerText = `Некорректный возраст (${ageInput.value} лун)`;
        return;
    }
    let trauma = parseInt(traumaInput.value.replace(',', '.'));
    if (isNaN(trauma)) {
        resultDiv.innerText = `Некорректный процент здоровья (${traumaInput.value}%)`;
        return;
    }

    age = Math.max(5, Math.min(275, age));
    trauma = 100 - trauma;
    trauma = Math.max(1, Math.min(100, trauma));

    const result = table[age];
    if (result === undefined) {
        resultDiv.innerText = `Какой-то сложный возраст (${age} лун)`;
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
    if (age >= 6) maxAmount = 2;
    if (age >= 12) maxAmount = 3;
    if (age >= 50) maxAmount = 4;
    if (age >= 200) maxAmount = 5;
    for (let i = 0; i < result.length; i++) {
        const now = result[i];
        if (now * 100 * maxAmount > trauma) {
            let hours = i * 0.25 * 24;
            let days = Math.floor(hours / 24);
            hours -= days * 24;
            const time = (days > 0 ? `${days} дней ` : ``) + `${hours} часов`;
            const amount = Math.ceil(trauma / (now * 100));
            resultDiv.innerHTML = `Для ${age} лун с ${trauma}% ушибов (${100 - trauma}% здоровья) носить нужно <b>${amount}</b> костоправов в течение <b>${time}</b>`;
            break;
        }
    }

});