export interface BusRoute {
  id: string;
  routeNumber: string;
  routeName: string;
  stops: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    estimatedTime: string;
  }[];
  schedule: {
    day: string;
    departureTime: string;
    arrivalTime: string;
  }[];
}

export interface BusTracking {
  busId: string;
  routeId: string;
  currentLocation: {
    latitude: number;
    longitude: number;
  };
  status: 'on-route' | 'stopped' | 'delayed' | 'completed';
  nextStop: string;
  estimatedArrival: string;
  passengers: number;
  capacity: number;
}

export const busRoutes: BusRoute[] = [
  {
    id: 'ROUTE001',
    routeNumber: 'B101',
    routeName: 'Campus to City Center',
    stops: [
      {
        id: 'STOP001',
        name: 'Main Campus Gate',
        latitude: 13.0827,
        longitude: 80.2707,
        estimatedTime: '08:00 AM'
      },
      {
        id: 'STOP002',
        name: 'Tech Park',
        latitude: 13.0828,
        longitude: 80.2708,
        estimatedTime: '08:15 AM'
      },
      {
        id: 'STOP003',
        name: 'Shopping Mall',
        latitude: 13.0829,
        longitude: 80.2709,
        estimatedTime: '08:30 AM'
      },
      {
        id: 'STOP004',
        name: 'City Center',
        latitude: 13.0830,
        longitude: 80.2710,
        estimatedTime: '08:45 AM'
      }
    ],
    schedule: [
      { day: 'Monday', departureTime: '08:00 AM', arrivalTime: '08:45 AM' },
      { day: 'Tuesday', departureTime: '08:00 AM', arrivalTime: '08:45 AM' },
      { day: 'Wednesday', departureTime: '08:00 AM', arrivalTime: '08:45 AM' },
      { day: 'Thursday', departureTime: '08:00 AM', arrivalTime: '08:45 AM' },
      { day: 'Friday', departureTime: '08:00 AM', arrivalTime: '08:45 AM' }
    ]
  },
  {
    id: 'ROUTE002',
    routeNumber: 'B102',
    routeName: 'Campus to Railway Station',
    stops: [
      {
        id: 'STOP005',
        name: 'Main Campus Gate',
        latitude: 13.0827,
        longitude: 80.2707,
        estimatedTime: '07:30 AM'
      },
      {
        id: 'STOP006',
        name: 'Hospital',
        latitude: 13.0826,
        longitude: 80.2706,
        estimatedTime: '07:45 AM'
      },
      {
        id: 'STOP007',
        name: 'Railway Station',
        latitude: 13.0825,
        longitude: 80.2705,
        estimatedTime: '08:00 AM'
      }
    ],
    schedule: [
      { day: 'Monday', departureTime: '07:30 AM', arrivalTime: '08:00 AM' },
      { day: 'Tuesday', departureTime: '07:30 AM', arrivalTime: '08:00 AM' },
      { day: 'Wednesday', departureTime: '07:30 AM', arrivalTime: '08:00 AM' },
      { day: 'Thursday', departureTime: '07:30 AM', arrivalTime: '08:00 AM' },
      { day: 'Friday', departureTime: '07:30 AM', arrivalTime: '08:00 AM' }
    ]
  }
];

export const busTracking: BusTracking = {
  busId: 'BUS001',
  routeId: 'ROUTE001',
  currentLocation: {
    latitude: 13.0828,
    longitude: 80.2708
  },
  status: 'on-route',
  nextStop: 'Shopping Mall',
  estimatedArrival: '08:30 AM',
  passengers: 25,
  capacity: 50
};
