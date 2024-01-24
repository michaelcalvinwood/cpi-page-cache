const axios = require('axios');

const getCategories = async host => {
    const response = await axios.get(`https://${host}/wp-json/wp/v2/categories`);
    console.log(response.data);
}

const program = async () => {
    const categories = await getCategories('www.competitionpolicyinternational.com');
}

const programWrapper = () => {
    try {
        program();
    } catch (err) {
        console.error(err);
    }
}

programWrapper();