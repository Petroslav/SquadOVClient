add_subdirectory(steam_protobuf)
add_subdirectory(zlib)
add_subdirectory(tinyxml2)

set(CMAKE_USE_SCHANNEL ON CACHE BOOL "")
set(ENABLE_ARES ON CACHE BOOL "")
add_subdirectory(curl)

set(BUILD_TZ_LIB ON CACHE BOOL "")
set(MANUAL_TZ_DB ON CACHE BOOL "")
add_subdirectory(date)

add_subdirectory(sqlite3)

set(PNG_BUILD_ZLIB ON CACHE BOOL "")
set(SKIP_INSTALL_ALL ON CACHE BOOL "")
add_subdirectory(libpng)

set(PA_USE_ASIO OFF)
set(PA_USE_DS OFF)
set(PA_USE_WMME OFF)
set(PA_USE_WDMKS OFF)
set(PA_USE_WDMKS_DEVICE_INFO OFF)
set(PA_ENABLE_DEBUG_OUTPUT ON)
add_subdirectory(portaudio)

add_subdirectory(libzmq)

set(CIVETWEB_ENABLE_CXX ON CACHE BOOL "")
add_subdirectory(civetweb)

set(BUILD_SHARED_LIBS_SAVED "${BUILD_SHARED_LIBS}")
set(BUILD_SHARED_LIBS OFF)
add_subdirectory(oatpp)
set(BUILD_SHARED_LIBS "${BUILD_SHARED_LIBS_SAVED}")

add_subdirectory(libcpuid)

set(SENTRY_BACKEND "crashpad" CACHE STRING "")
set(SENTRY_BUILD_SHARED_LIBS ON CACHE BOOL "")
add_subdirectory(sentry-native)