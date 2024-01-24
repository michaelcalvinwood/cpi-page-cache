require('dotenv').config();
const axios = require('axios');
const mysql = require('mysql2/promise');
const cheerio = require('cheerio');
const fs = require('fs');

const { CPI_PRODUCTION_HOST, CPI_PRODUCTION_DATABASE, CPI_PRODUCTION_USER, CPI_PRODUCTION_PASSWORD } = process.env;

const sql = mysql.createPool({
    host: CPI_PRODUCTION_HOST,
    user: CPI_PRODUCTION_USER,
    database: CPI_PRODUCTION_DATABASE,
    password: CPI_PRODUCTION_PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
    idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });

const getCategories = async host => {
    const categories = [];
    let page = 1;
    const perPage = 100;
    let count = 100;
    while (count > 0) {
        const response = await axios.get(`https://${host}/wp-json/wp/v2/categories/?page=${page}&per_page=100`);
        count = response.data.length;
        for (let i = 0; i < count; ++i) {
            const category = response.data[i];
            const { id, slug } = category;
            categories.push({id, slug});
        }
        console.log(page, count);
        ++page;
    }
    return categories;
    
}

const createPageCacheTable = async (name = '') => {
    const q = `CREATE TABLE IF NOT EXISTS ${name ? `page_cache_${name}` : `page_cache`} (
        path VARCHAR(256) NOT NULL PRIMARY KEY,
        html LONGTEXT,
        orig_html LONGTEXT
    )`

    const r = await sql.query(q);
    console.log('Table Creation Result', r);
    return r;
} 

const updateCategoryCache = async (category) => {
    let response = await axios.get(`https://epsilon.competitionpolicyinternational.com/category/${category.slug}`);
    const origHtml = response.data;
    const dom = cheerio.load(origHtml);
    //console.log('got dom', dom.html());
    dom('script').each((index, el) => {
       dom(el).text('console.log("removed script here");');
    })
    const html = dom.html();
    const q = `INSERT INTO page_cache_category (path, html, orig_html) VALUES (${sql.escape(category.slug)}, ${sql.escape(html)}, ${sql.escape(origHtml)})
    ON DUPLICATE KEY UPDATE html = ${sql.escape(html)}, orig_html = ${sql.escape(origHtml)}`;

    await sql.query(q);
    
}

const program = async () => {
    await createPageCacheTable('category');
    //const categories = await getCategories('www.competitionpolicyinternational.com');
    //fs.writeFileSync('./categories.json', JSON.stringify(categories), 'utf-8');
    
    const categoriesJson = fs.readFileSync('./categories.json', 'utf-8');
    const categories = JSON.parse(categoriesJson);

    for (let i = 0; i < categories.length; ++i) {
        console.log(i, categories[i].slug);
        await updateCategoryCache(categories[i]);
    }
}

const programWrapper = () => {
    try {
        program();
    } catch (err) {
        console.error(err);
    }
}

programWrapper();