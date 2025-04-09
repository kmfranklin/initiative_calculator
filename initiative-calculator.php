<?php

/**
 * Plugin Name: Initiative Calculator
 * Description: Generates tailored service recommendations from form inputs using Gravity Forms.
 * Version: 1.0
 * Author: Kevin Franklin — Nomadic Software
 */

add_action('rest_api_init', function () {
  register_rest_route('initiative-calc/v1', '/services', [
    'methods' => 'GET',
    'callback' => 'initiative_calc_get_services',
    'permission_callback' => '__return_true'
  ]);
});

// 🔹 Callback function that returns the service dataset as JSON
function initiative_calc_get_services()
{
  $json_path = plugin_dir_path(__FILE__) . 'services/services.json';
  $json = file_get_contents($json_path);
  return json_decode($json, true);
}
