import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  memo,
} from 'react'
import { Map as OpenLayersMap, View } from 'ol'
import Tile from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import Box from '@material-ui/core/Box'
import { renderer, geometry, coordinates } from 'geospatialdraw'
import { useCursorPosition } from './effects'

export const geometryListToViewport = geometryList =>
  geometryList.length > 0
    ? geometry.combineExtents(geometryList.map(geometry => geometry.bbox))
    : null

const Coordinates = ({ lat, lon, coordinateType }) =>
  coordinateType === coordinates.LAT_LON ? (
    <React.Fragment>
      {Math.abs(lat).toFixed(6)}
      &deg; {lat < 0 ? 'S' : 'N'} {Math.abs(lon).toFixed(6)}
      &deg; {lon < 0 ? 'W' : 'E'}
    </React.Fragment>
  ) : null

const WorldMap = ({
  projection,
  style,
  geos = [],
  viewport = null,
  maxZoom,
  minZoom,
  zoom,
  coordinateType = coordinates.LAT_LON,
  onMapLoaded = () => {},
  width = '100%',
  height = '100%',
}) => {
  const mapDiv = useRef(null)
  const [mapControls, createMapControls] = useState(null)
  const [container, setContainer] = useState({ width: 0, height: 0 })
  const { cursor, setMap } = useCursorPosition()
  useEffect(
    () => {
      if (mapDiv.current && !mapControls) {
        const map = new OpenLayersMap({
          layers: [
            new Tile({
              source: new OSM(),
            }),
          ],
          target: mapDiv.current,
          view: new View({
            center: [0, 0],
            rotation: 0,
            zoom,
            minZoom,
            maxZoom,
            projection,
          }),
        })
        mapDiv.current
          .querySelectorAll(
            '.ol-overlaycontainer-stopevent, .ol-overlaycontainer'
          )
          .forEach(el => (el.style.display = 'none'))
        const geoRenderer = new renderer.Renderer(map, style, maxZoom)
        map.once('rendercomplete', () => {
          createMapControls({ map, geoRenderer })
        })
      }
    },
    [mapDiv, mapControls, zoom, minZoom, maxZoom, projection, style]
  )
  useEffect(
    () => {
      if (mapControls) {
        setMap(mapControls.map)
        onMapLoaded(mapControls.map)
      }
    },
    [mapControls, setMap, onMapLoaded]
  )
  useEffect(
    () => {
      if (mapControls) {
        mapControls.geoRenderer.clearGeos()
        mapControls.geoRenderer.renderList(geos)
      }
    },
    [mapControls, geos]
  )
  useEffect(
    () => {
      if (mapControls && viewport) {
        mapControls.geoRenderer.panToExtent(viewport)
      }
    },
    [mapControls, viewport]
  )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (mapDiv.current) {
      const width = mapDiv.current.parentElement.offsetWidth
      const height = mapDiv.current.parentElement.offsetHeight
      if (width !== container.width || height !== container.height) {
        setContainer({ width, height })
      }
    }
  })
  useLayoutEffect(
    () => {
      if (mapControls) {
        window.requestAnimationFrame(() => {
          mapControls.geoRenderer.resizeMap()
        })
      }
    },
    [mapControls, container.width, container.height]
  )
  return (
    <Box width={width} height={height} bgcolor="black" position="relative">
      <Box width="100%" height="100%" ref={mapDiv} className="map" />
      <Box
        position="absolute"
        left="0"
        bottom="0"
        bgcolor="black"
        color="white"
        p={1}
      >
        <Coordinates coordinateType={coordinateType} {...cursor} />
      </Box>
    </Box>
  )
}

export default memo(WorldMap)
