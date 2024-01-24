const axios = require('axios');

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

const program = async () => {
    const categories = await getCategories('www.competitionpolicyinternational.com');
    console.log(categories);
}

const programWrapper = () => {
    try {
        program();
    } catch (err) {
        console.error(err);
    }
}

programWrapper();