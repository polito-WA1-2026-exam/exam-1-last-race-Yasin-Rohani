import { Card } from "react-bootstrap";

function NetworkMap({ stations, segments, segmentLines }) {
  function getLineColor(segmentId) {
    const segmentLine = segmentLines?.find(
      (item) => item.segmentId === segmentId
    );

    return segmentLine?.lineColor || "gray";
  }

  function getStationById(stationId) {
    return stations.find((station) => station.id === stationId);
  }

  return (
    <Card className="mb-4">
      <Card.Body>
        <Card.Title as="h2" className="h4">
          Network map
        </Card.Title>

        <div className="border rounded bg-light p-3">
          <svg
            viewBox="0 0 650 420"
            width="100%"
            height="420"
            role="img"
            aria-label="Full underground network map"
          >
            {segments.map((segment) => {
              const station1 = getStationById(segment.station1Id);
              const station2 = getStationById(segment.station2Id);

              if (!station1 || !station2) {
                return null;
              }

              return (
                <line
                  key={segment.id}
                  x1={station1.x}
                  y1={station1.y}
                  x2={station2.x}
                  y2={station2.y}
                  stroke={getLineColor(segment.id)}
                  strokeWidth="8"
                  strokeLinecap="round"
                />
              );
            })}

            {stations.map((station) => (
              <g key={station.id}>
                <circle
                  cx={station.x}
                  cy={station.y}
                  r="13"
                  fill="white"
                  stroke="black"
                  strokeWidth="3"
                />
                <text
                  x={station.x}
                  y={station.y - 22}
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="600"
                >
                  {station.name}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </Card.Body>
    </Card>
  );
}

export default NetworkMap;