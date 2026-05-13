import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'dart:async';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() {
  runApp(VicinityApp());
}

class VicinityApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Vicinity',
      theme: ThemeData(
        primarySwatch: Colors.indigo,
        visualDensity: VisualDensity.adaptivePlatformDensity,
      ),
      home: MapScreen(),
    );
  }
}

class MapScreen extends StatefulWidget {
  @override
  _MapScreenState createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  GoogleMapController? _mapController;
  Position? _currentPosition;
  Set<Marker> _markers = {};
  Timer? _locationTimer;

  static final CameraPosition _kInitialPosition = CameraPosition(
    target: LatLng(37.42796133580664, -122.085749655962),
    zoom: 14.4746,
  );

  @override
  void initState() {
    super.initState();
    _checkPermissions();
    _startLocationTracking();
  }

  Future<void> _checkPermissions() async {
    bool serviceEnabled;
    LocationPermission permission;

    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return;

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) return;
    }
  }

  void _startLocationTracking() {
    _locationTimer = Timer.periodic(Duration(seconds: 5), (timer) async {
      _currentPosition = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high
      );
      
      if (_currentPosition != null) {
        _sendLocationToBackend(_currentPosition!);
        _updateMap();
      }
    });
  }

  Future<void> _sendLocationToBackend(Position pos) async {
    try {
      final response = await http.post(
        Uri.parse('https://api.vicinity.app/location/update'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'userId': 'current-user-id',
          'latitude': pos.latitude,
          'longitude': pos.longitude,
          'accuracy': pos.accuracy,
          'timestamp': DateTime.now().millisecondsSinceEpoch,
        }),
      );
      print('Backend Response: ${response.statusCode}');
    } catch (e) {
      print('Error sending location: $e');
    }
  }

  void _updateMap() {
    if (_currentPosition == null) return;

    setState(() {
      _markers.add(
        Marker(
          markerId: MarkerId('current_user'),
          position: LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
          infoWindow: InfoWindow(title: 'You'),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
        ),
      );
    });

    _mapController?.animateCamera(
      CameraUpdate.newLatLng(
        LatLng(_currentPosition!.latitude, _currentPosition!.longitude)
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Vicinity')),
      body: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: _kInitialPosition,
            markers: _markers,
            onMapCreated: (controller) => _mapController = controller,
            myLocationEnabled: true,
            myLocationButtonEnabled: true,
          ),
          Positioned(
            bottom: 20,
            right: 20,
            child: FloatingActionButton(
              onPressed: _showSOSAlert,
              backgroundColor: Colors.red,
              child: Icon(Icons.warning_amber_rounded),
            ),
          ),
        ],
      ),
    );
  }

  void _showSOSAlert() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Emergency SOS'),
        content: Text('Send your live location to all trusted contacts?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              // Trigger SOS API
              Navigator.pop(context);
            },
            child: Text('SEND SOS'),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _locationTimer?.cancel();
    super.dispose();
  }
}
