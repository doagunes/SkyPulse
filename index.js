import express, { text } from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
const port = 3000;
const yourAPIKey = "2e24827ea904befa431749c234a6e945";

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.render("index.ejs");
});

const weatherActivities = {
    clear: ["Go to the beach", "Cycling", "Picnic", "Jogging in the park", "Outdoor photography"],
    clouds: ["Visit a museum", "Explore an indoor cafe", "Go to an art gallery", "Attend a cooking class"],
    rain: ["Enjoy a cozy indoor coffee", "Rainy day hike (wear waterproofs)", "Read a book at home"],
    snow: ["Go skiing", "Play in the snow", "Build a snowman", "Visit a winter market"],
    drizzle: ["Walk in the drizzle with an umbrella", "Enjoy a cup of coffee inside", "Explore a bookstore"],
    thunderstorm: ["Stay indoors", "Watch a movie", "Visit a museum", "Cook a meal at home"],
    mist: ["Take a morning walk in the mist", "Explore a quiet park", "Read a book in a cozy space"],
    fog: ["Stay indoors", "Enjoy a warm drink", "Visit a cafe", "Have a cozy afternoon at home"],
    haze: ["Relax indoors", "Go for a casual stroll", "Visit a spa", "Read or enjoy a hobby indoors"],
    dust: ["Stay indoors", "Indoor activities", "Avoid outdoor exposure", "Clean up indoors"],
    sand: ["Stay indoors", "Go to a protected area", "Wear protective clothing if outside"],
    ash: ["Stay indoors", "Avoid outdoor activities", "Stay safe from volcanic ash"],
    squall: ["Stay indoors", "Seek shelter", "Avoid outdoor activities", "Wait for the squall to pass"],
    tornado: ["Take shelter immediately", "Stay in a safe, strong building", "Stay away from windows and doors"]
};

function getActivitiesForWeather(weatherType) {
    return weatherActivities[weatherType] || ["No activity suggestions available for this weather type."];
}

app.post("/get-weather", async (req,res) => {
    const city = req.body["city"];
    try{
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${yourAPIKey}&units=metric`);
        const result = response.data;
        const weatherType = result.weather[0].main.toLowerCase(); 
        const activities = getActivitiesForWeather(weatherType);

        res.render("weather.ejs", {
            weather: result,
            activities: activities,
        });
    }catch{
        console.log(error);
        res.send("Error occurred while fetching weather data. Please try again.");
    }
});

app.post("/get-uv", async (req,res) => {
    const city = req.body["city"];
    try{
        const geocodeResponse = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${yourAPIKey}&units=metric`);
        const lat = geocodeResponse.data.coord.lat;
        const lon = geocodeResponse.data.coord.lon

        const response = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=uv_index_max&timezone=auto`);
        const result = response.data;
        const uvScale = result.daily.uv_index_max[0];
        let sentText = "";
        if(uvScale < 2){
            sentText = "Low risk. No sun protection needed.😌";
        }else if(uvScale >= 2 && uvScale < 5){
            sentText = "Moderate risk. Wear a hat, sunglasses, and apply sunscreen.😎";
        }else if(uvScale >= 5 && uvScale < 7){
            sentText = "High risk. Stay in the shade between 11 AM - 4 PM and use SPF 30+ sunscreen.🌤️";
        }else if(uvScale >= 7 && uvScale < 10){
            sentText = "Very high risk. Avoid sun exposure as much as possible and wear long-sleeved clothing.🌞";
        }else if(uvScale >= 10){
            sentText = "Extreme risk. Sun exposure is very dangerous! Use SPF 50+ and stay out of direct sunlight.🔥";
        }   

        res.render("uv.ejs", {
            text: sentText,
            city: city,
        });
    }catch(error){
        console.log(error);
        res.send("Error occurred while fetching weather data. Please try again.");
    }
});

app.post("/get-pollution", async (req,res) => {
    const city = req.body["city"];
    try{
        const geocodeResponse = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${yourAPIKey}&units=metric`);
        const lat = geocodeResponse.data.coord.lat;
        const lon = geocodeResponse.data.coord.lon

        const response = await axios.get(`http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${yourAPIKey}`);
        const result = response.data;
        const component = result.list[0].components.so2;
        let sentText = "";
        if(component < 20){
            sentText = "The air quality is Good. It's safe to go outside.😌";
        }else if(component >= 20 && component < 80){
            sentText = "The air quality is Fair. Be cautious if you go outside.😕";
        }else if(component >= 80 && component < 250){
            sentText = "The air quality is Moderate. Avoid prolonged exposure to outdoor air.😟";
        }else if(component >= 250 && component < 350){
            sentText = "The air quality is Poor. Limit outdoor activities.😫";
        }else if(component >= 350){
            sentText = "The air quality is Very Poor. Stay indoors as much as possible.";
        }
        res.render("pollution.ejs", {
            city: city,
            text: sentText,
        });
    }catch(error){
        console.log(error);
        res.send("Error occurred while fetching weather data. Please try again.");
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
