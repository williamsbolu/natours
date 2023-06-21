/* eslint-disable */

export const displayMap = (locations) => {
    mapboxgl.accessToken =
        'pk.eyJ1Ijoid2lsbHRlYyIsImEiOiJjbGljdWZhOTUwMG8wM2VxajBzdDRpcXAwIn0.thm3x1MzEIvxg3q4Ct_q4w';

    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/willtec/clidhpmh4002w01pgfkqwgi5j',
        scrollZoom: false,
        // center: [-118.146555, 34.134616],
        // zoom: 10,
        // interactive: false,
    });

    // we get access to the mapbox object because we include the mapbox library at the begining of our page(in the head"script")
    const bounds = new mapboxgl.LngLatBounds();

    locations.forEach((loc) => {
        // Create marker
        const el = document.createElement('div');
        el.className = 'marker';

        // Add arker
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom',
        })
            .setLngLat(loc.coordinates)
            .addTo(map);

        // Add popup
        new mapboxgl.Popup({
            offset: 30,
            focusAfterOpen: false,
        })
            .setLngLat(loc.coordinates)
            .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
            .addTo(map);

        // Extend map bounds to include the current location
        bounds.extend(loc.coordinates);
    });

    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100,
        },
    });
};
