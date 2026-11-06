cmake_minimum_required(VERSION 3.21)

project(KlyroDesktop VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTOUIC ON)
set(CMAKE_AUTORCC ON)

find_package(Qt6 6.5 REQUIRED COMPONENTS Widgets Svg)

add_executable(KlyroDesktop
    src/main.cpp
    ui/mainwindow.ui
    resources/resources.qrc

    include/gui/ThemeManager.hpp
    include/gui/BoardView.hpp
    include/gui/TopBarWidget.hpp
    include/gui/ICLibraryPanel.hpp
    include/gui/PropertiesPanel.hpp
    include/gui/BottomPanel.hpp
    include/gui/MainWindow.hpp
    include/gui/SvgIcon.hpp

    src/gui/ThemeManager.cpp
    src/gui/BoardView.cpp
    src/gui/TopBarWidget.cpp
    src/gui/ICLibraryPanel.cpp
    src/gui/PropertiesPanel.cpp
    src/gui/BottomPanel.cpp
    src/gui/MainWindow.cpp
    include/gui/SvgIcon.hpp
)

target_include_directories(KlyroDesktop PRIVATE include)
set_target_properties(KlyroDesktop PROPERTIES AUTOUIC_SEARCH_PATHS "${CMAKE_CURRENT_SOURCE_DIR}/ui")

target_link_libraries(KlyroDesktop PRIVATE
  Qt6::Widgets
  Qt6::Svg
)

if(WIN32)
    set_target_properties(KlyroDesktop PROPERTIES WIN32_EXECUTABLE TRUE)
endif()
