const puppeteer = require('puppeteer');
const axios = require('axios');
require('dotenv').config();

( async () => {
    //dolar blue, MEP, CCL, Solidario
    let dolarhoy_url = 'https://dolarhoy.com/';
    //dolar BNA, divisa
    let bna_url = 'https://bna.com.ar/Personas';
    // Euro blue, oficial
    let euro_blue_url = 'https://www.euroblue.com.ar/';

    let browser = await puppeteer.launch({ headless: false });

    // >> DOLAR BLUE / SOLIDARIO / MEP / CCL - DolarHoy 

    let page_dolar_hoy = await browser.newPage();

    await page_dolar_hoy.goto(dolarhoy_url);

    let data_dolar_hoy = await page_dolar_hoy.evaluate(() => {
        return [
            {
                id: "dolar_blue",
                name: 'Dólar Blue',
                value: document.querySelector('#home_0 > div.modulo.modulo_bloque > section > div > div > div > div.tile.is-parent.is-9.cotizacion.is-vertical > div > div.tile.is-parent.is-5 > div > div.values > div.venta > div.val').innerText.substring(1),
                currency: "ARS"
            },
            {
                id: "dolar_ccl",
                name: "Dólar CCL",
                value: document.querySelector('#home_0 > div.modulo.modulo_bloque > section > div > div > div > div.tile.is-parent.is-9.cotizacion.is-vertical > div > div.tile.is-parent.is-7.is-vertical > div:nth-child(4) > div > div.venta > div.val').innerText.substring(1),
                currency: "ARS"
            },
            {
                id: "dolar_mep",
                name: "Dólar MEP",
                value: document.querySelector('#home_0 > div.modulo.modulo_bloque > section > div > div > div > div.tile.is-parent.is-9.cotizacion.is-vertical > div > div.tile.is-parent.is-7.is-vertical > div:nth-child(3) > div > div.venta > div.val').innerText.substring(1),
                currency: "ARS"
            },
            {
                id: "dolar_solidario",
                name: "Dólar Solidario",
                value: document.querySelector('#home_0 > div.modulo.modulo_bloque > section > div > div > div > div.tile.is-parent.is-9.cotizacion.is-vertical > div > div.tile.is-parent.is-7.is-vertical > div:nth-child(5) > div > div.venta > div.val').innerText.substring(1),
                currency: "ARS"
            }

        ]
    });
 
    // >> DOLAR OFICIAL / DIVISA - BNA

    let page_bna = await browser.newPage();

    await page_bna.goto(bna_url, { waitUntil: 'networkidle2'});

    let data_bna = await page_bna.evaluate(() => {
        return [
            {
                id: "dolar_oficial",
                name: 'Dólar BNA',
                value: document.querySelector('#billetes > table > tbody > tr:nth-child(1) > td:nth-child(3)').innerText.replace(',', '.'),
                currency: "ARS"
            },
            {
                id: "dolar_divisa",
                name: "Dólar Divisa",
                value: document.querySelector('#divisas > table > tbody > tr:nth-child(1) > td:nth-child(3)').innerText,
                currency: "ARS"
            }
        ]
    });

    // >> EURO - euroblue.com.ar 
 
    let page_euro_blue = await browser.newPage();

    await page_euro_blue.goto(euro_blue_url, { timeout: 0 });

    let data_euro = await page_euro_blue.waitForSelector('#content > div.entry-content > div > div.elementor.elementor-9415 > div > div > section.elementor-section.elementor-top-section.elementor-element.elementor-element-26d46d3a.elementor-section-boxed.elementor-section-height-default.elementor-section-height-default > div > div > div.elementor-column.elementor-col-50.elementor-top-column.elementor-element.elementor-element-1a0238f3 > div > div > div > div > div > table:nth-child(4) > tbody > tr:nth-child(2) > td:nth-child(2)')
        .then(() =>  page_euro_blue.evaluate(() => {
            let valor_oficial = document.querySelector('#content > div.entry-content > div > div.elementor.elementor-9415 > div > div > section.elementor-section.elementor-top-section.elementor-element.elementor-element-26d46d3a.elementor-section-boxed.elementor-section-height-default.elementor-section-height-default > div > div > div.elementor-column.elementor-col-50.elementor-top-column.elementor-element.elementor-element-1a0238f3 > div > div > div > div > div > table:nth-child(4) > tbody > tr:nth-child(2) > td:nth-child(2)').innerText.substring(1);
            return [
                {
                    id: "euro_blue",
                    name: 'Euro Blue',
                    value: document.querySelector('#content > div.entry-content > div > div.elementor.elementor-9415 > div > div > section.elementor-section.elementor-top-section.elementor-element.elementor-element-26d46d3a.elementor-section-boxed.elementor-section-height-default.elementor-section-height-default > div > div > div.elementor-column.elementor-col-50.elementor-top-column.elementor-element.elementor-element-1a0238f3 > div > div > div > div > div > table:nth-child(2) > tbody > tr:nth-child(2) > td:nth-child(2) > p').innerText,
                    currency: "ARS"
                },
                {
                    id: "euro_oficial",
                    name: "Euro Oficial",
                    value: valor_oficial,
                    currency: "ARS"
                },
                {
                    id: "euro_solidario",
                    name: "Euro Solidario",
                    value: valor_oficial * 1.65 + "",
                    currency: "ARS"
                }
            ]
        })
    )

    let data = data_dolar_hoy.concat(data_bna, data_euro);

    await browser.close();    

    //Send data to our API
    //Yes, I know I should be sending the whole array in a single request...

    data.forEach(rate => {
        await axios({
            url: process.env.API_URL,
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `bearer ${process.env.API_TOKEN}`,
                "Access-Control-Allow-Origin": "*"
            },
            data: JSON.stringify(rate)
        })
    });

})();