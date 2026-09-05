# Adds a reproducible UI test target to the gitignored Expo-generated iOS project.
require 'xcodeproj'
project = Xcodeproj::Project.open('example/ios/reactnativegradientmaskexample.xcodeproj')
app = project.targets.find { |target| target.name == 'reactnativegradientmaskexample' }
raise 'Run the Example iOS prebuild first' unless app
target = project.targets.find { |item| item.name == 'GradientMaskUITests' } || project.new_target(:ui_test_bundle, 'GradientMaskUITests', :ios, '16.4')
target.add_dependency(app) unless target.dependencies.any? { |dependency| dependency.target == app }
path = '../../tests/ios/ViewportTouchUITests.swift'
file = project.main_group.find_file_by_path(path) || project.main_group.new_file(path)
target.source_build_phase.add_file_reference(file) unless target.source_build_phase.files_references.include?(file)
target.build_configurations.each do |configuration|
  configuration.build_settings.merge!({
    'SWIFT_VERSION' => '5.0',
    'PRODUCT_NAME' => 'GradientMaskUITests',
    'PRODUCT_MODULE_NAME' => 'GradientMaskUITests',
    'PRODUCT_BUNDLE_IDENTIFIER' => 'expo.modules.gradientmask.uitests',
    'GENERATE_INFOPLIST_FILE' => 'YES',
    'TEST_TARGET_NAME' => app.name,
    'TARGETED_DEVICE_FAMILY' => '1,2'
  })
end
project.save
scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(app)
scheme.add_build_target(target)
scheme.add_test_target(target)
scheme.test_action.build_configuration = 'Release'
scheme.launch_action.build_configuration = 'Release'
scheme.save_as(project.path, 'GradientMaskUITests', true)
puts 'GradientMaskUITests scheme configured'
