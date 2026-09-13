<?php
/**
 * Plugin Name:       Drass Wealth Tools
 * Plugin URI:        https://www.drasswealthmanagement.com/
 * Description:       Retirement, tax and insurance calculators for Drass Wealth Management. Engines run on the Russell Capital Systems platform; this plugin renders them inside WordPress via shortcodes and blocks.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            Russell Holdings Management LLC
 * License:           Proprietary — licensed to Drass Wealth Management
 * Text Domain:       drass-wealth-tools
 *
 * ---------------------------------------------------------------------------
 * FOR THE SITE ADMINISTRATOR
 *
 * Install:  Plugins > Add New > Upload Plugin > choose this .zip > Activate.
 * Then:     Settings > Drass Wealth Tools > paste the API base URL supplied
 *           with this package. Nothing works until that field is set, and the
 *           plugin says so on every page rather than rendering a broken tool.
 *
 * This plugin adds no database tables, modifies no existing content, and
 * registers no public write endpoints. Deactivating it removes every tool
 * cleanly and leaves your pages exactly as they were.
 * ---------------------------------------------------------------------------
 */

// No direct file access. A plugin file reachable over HTTP without WordPress
// loaded is the oldest hole in the ecosystem.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'DWT_VERSION', '1.0.0' );
define( 'DWT_FILE', __FILE__ );
define( 'DWT_DIR', plugin_dir_path( __FILE__ ) );
define( 'DWT_URL', plugin_dir_url( __FILE__ ) );

require_once DWT_DIR . 'includes/class-dwt-compliance.php';
require_once DWT_DIR . 'includes/class-dwt-api.php';
require_once DWT_DIR . 'includes/class-dwt-shortcodes.php';
require_once DWT_DIR . 'includes/class-dwt-admin.php';

add_action( 'plugins_loaded', static function () {
	DWT_Admin::init();
	DWT_Shortcodes::init();
} );

add_action( 'wp_enqueue_scripts', static function () {
	wp_register_style( 'dwt', DWT_URL . 'assets/dwt.css', [], DWT_VERSION );
	wp_register_script( 'dwt', DWT_URL . 'assets/dwt.js', [], DWT_VERSION, true );
} );
