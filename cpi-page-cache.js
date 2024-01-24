require('dotenv').config();
const axios = require('axios');
const mysql = require('mysql2/promise');
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
        html LONGTEXT
    )`

    const r = await sql.query(q);
    console.log('Table Creation Result', r);
    return r;
} 

const updateCategoryCache = async (category) => {
    let html = await axios.get(`https://epsilon.competitionpolicyinternational.com/category/${category.slug}`);
    console.log(html);
}

const program = async () => {
    await createPageCacheTable('category');
    //const categories = await getCategories('www.competitionpolicyinternational.com');
    //fs.writeFileSync('./categories.json', JSON.stringify(categories), 'utf-8');
    
    const categoriesJson = fs.readFileSync('./categories.json', 'utf-8');
    const categories = JSON.parse(categoriesJson);

    for (let i = 0; i < categories.length; ++i) {
        console.log(categories[i]);
        //await updateCategoryCache(categories[i]);
        break;
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