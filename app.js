        const OPENWEATHER_API_KEY = 'f2f44b898787ea5294e64cafdb598d5b';
        
        let map;
        let markers = [];
        let markersLayer;

        // Major cities for wind data
        const cities = [
            { name: "New York", lat: 40.7128, lon: -74.0060 },
            { name: "London", lat: 51.5074, lon: -0.1278 },
            { name: "Tokyo", lat: 35.6762, lon: 139.6503 },
            { name: "Sydney", lat: -33.8688, lon: 151.2093 },
            { name: "Paris", lat: 48.8566, lon: 2.3522 },
            { name: "Dubai", lat: 25.2048, lon: 55.2708 },
            { name: "Singapore", lat: 1.3521, lon: 103.8198 },
            { name: "Mumbai", lat: 19.0760, lon: 72.8777 },
            { name: "São Paulo", lat: -23.5505, lon: -46.6333 },
            { name: "Moscow", lat: 55.7558, lon: 37.6173 },
            { name: "Cairo", lat: 30.0444, lon: 31.2357 },
            { name: "Los Angeles", lat: 34.0522, lon: -118.2437 },
            { name: "Shanghai", lat: 31.2304, lon: 121.4737 },
            { name: "Mexico City", lat: 19.4326, lon: -99.1332 },
            { name: "Istanbul", lat: 41.0082, lon: 28.9784 },
            { name: "Buenos Aires", lat: -34.6037, lon: -58.3816 },
            { name: "Toronto", lat: 43.6532, lon: -79.3832 },
            { name: "Berlin", lat: 52.5200, lon: 13.4050 },
            { name: "Bangkok", lat: 13.7563, lon: 100.5018 },
            { name: "Cape Town", lat: -33.9249, lon: 18.4241 },
            { name: "Rome", lat: 41.9028, lon: 12.4964 },
            { name: "Hong Kong", lat: 22.3193, lon: 114.1694 },
            { name: "Seoul", lat: 37.5665, lon: 126.9780 },
            { name: "Chicago", lat: 41.8781, lon: -87.6298 },
            { name: "Madrid", lat: 40.4168, lon: -3.7038 }
        ];

        // Initialize map
        function initMap() {
            map = L.map('map', {
                center: [20, 0],
                zoom: 2,
                minZoom: 2,
                maxZoom: 10
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(map);

            markersLayer = L.layerGroup().addTo(map);
        }

        // Get wind speed color
        function getWindColor(speed) {
            const speedNum = parseFloat(speed);
            if (speedNum < 10) return '#00ff00';
            if (speedNum < 30) return '#ffff00';
            if (speedNum < 50) return '#ff9900';
            return '#ff0000';
        }

        // Convert wind direction to cardinal
        function getWindDirection(degrees) {
            const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
            const index = Math.round(degrees / 22.5) % 16;
            return directions[index];
        }

        // Fetch from OpenWeatherMap
        async function fetchOpenWeatherMap(city) {
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`OpenWeatherMap Error: ${response.status}`);
            }
            
            const data = await response.json();

            return {
                name: data.name || city.name,
                lat: city.lat,
                lon: city.lon,
                windSpeed: (data.wind.speed * 3.6).toFixed(1),
                windDirection: data.wind.deg || 0,
                windDirectionCardinal: getWindDirection(data.wind.deg || 0),
                source: 'OpenWeatherMap'
            };
        }

        // Fetch from OpenMeteo
        async function fetchOpenMeteo(city) {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`OpenMeteo Error: ${response.status}`);
            }
            
            const data = await response.json();

            return {
                name: city.name,
                lat: city.lat,
                lon: city.lon,
                windSpeed: data.current.wind_speed_10m.toFixed(1),
                windDirection: data.current.wind_direction_10m || 0,
                windDirectionCardinal: getWindDirection(data.current.wind_direction_10m || 0),
                source: 'OpenMeteo'
            };
        }

        // Main fetch function with fallback
        async function fetchWindData(city) 
	{
    		try 
		{
        		return await fetchOpenWeatherMap(city);
    		}catch (error) 
		{
        		console.warn(`OpenWeatherMap failed for ${city.name}, trying OpenMeteo...`);
    		}
    		try 
		{
        		return await fetchOpenMeteo(city);
    		}catch (error) 
		{
        		console.error(`All APIs failed for ${city.name}:`, error);
        		return null;
    		}
	}


        // Add marker to map
        function addMarker(data) {
            const color = getWindColor(data.windSpeed);
            
            const icon = L.divIcon({
                className: 'custom-marker',
                html: `<div style="
                    width: 20px;
                    height: 20px;
                    background: ${color};
                    border: 2px solid #fff;
                    border-radius: 50%;
                    box-shadow: 0 0 10px ${color};
                "></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });

            const marker = L.marker([data.lat, data.lon], { icon: icon });
            
            const popupContent = `
                <div class="popup-content">
                    <h4>${data.name}</h4>
                    <p><strong>Wind Speed:</strong> <span class="wind-speed">${data.windSpeed} km/h</span></p>
                    <p><strong>Direction:</strong> ${data.windDirectionCardinal} (${Math.round(data.windDirection)}°)</p>
                    <p><strong>Coordinates:</strong> ${data.lat.toFixed(4)}, ${data.lon.toFixed(4)}</p>
                    <p style="font-size: 0.8rem; color: #aaa; margin-top: 8px;"><em>Source: ${data.source}</em></p>
                </div>
            `;
            
            marker.bindPopup(popupContent);
            marker.addTo(markersLayer);
            markers.push(marker);
        }

        // Load all wind data
        async function loadWindData() {
            document.getElementById('loading').style.display = 'block';
            markers = [];
            markersLayer.clearLayers();
            
            let openWeatherCount = 0;
            let openMeteoCount = 0;
            
            for (const city of cities) {
                const data = await fetchWindData(city);
                if (data) {
                    addMarker(data);
                    
                    if (data.source === 'OpenWeatherMap') {
                        openWeatherCount++;
                    } else if (data.source === 'OpenMeteo') {
                        openMeteoCount++;
                    }
                }
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            // Update status
            const apiStatus = document.getElementById('api-status');
            const total = openWeatherCount + openMeteoCount;
            
            if (total === 0) {
                apiStatus.innerHTML = '<span class="status-dot dot-red"></span><span>API ERROR</span>';
            } else if (openWeatherCount > 0 && openMeteoCount === 0) {
                apiStatus.innerHTML = `<span class="status-dot dot-green"></span><span>OpenWeather (${openWeatherCount})</span>`;
            } else if (openMeteoCount > 0 && openWeatherCount === 0) {
                apiStatus.innerHTML = `<span class="status-dot dot-cyan"></span><span>OpenMeteo (${openMeteoCount})</span>`;
            } else {
                apiStatus.innerHTML = `<span class="status-dot dot-yellow"></span><span>Mixed (OW:${openWeatherCount} OM:${openMeteoCount})</span>`;
            }

            document.getElementById('location-count').textContent = `${total} LOCATIONS`;
            document.getElementById('update-time').textContent = `Updated: ${new Date().toLocaleTimeString()}`;
            document.getElementById('loading').style.display = 'none';
        }

        // Refresh data
        function refreshData() {
            loadWindData();
        }

        // Show all markers
        function showAllMarkers() {
            if (markers.length > 0) {
                const group = new L.featureGroup(markers);
                map.fitBounds(group.getBounds().pad(0.1));
            }
        }

        // Clear markers
        function clearMarkers() {
            markersLayer.clearLayers();
            markers = [];
            document.getElementById('location-count').textContent = '0 LOCATIONS';
        }

        // Initialize
        window.addEventListener('load', () => {
            initMap();
            loadWindData();
        });
