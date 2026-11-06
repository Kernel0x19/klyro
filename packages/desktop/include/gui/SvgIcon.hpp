#pragma once

#include <QColor>
#include <QDebug>
#include <QFile>
#include <QIcon>
#include <QPainter>
#include <QPixmap>
#include <QRectF>
#include <QSvgRenderer>
#include <QSize>

// Render an SVG resource into a high-resolution pixmap.
inline QPixmap renderSvgPixmap(
    const QString& resourcePath,
    const QSize& logicalSize,
    const QColor& strokeColor
    ) {
    QFile file(resourcePath);

    if (!file.open(QIODevice::ReadOnly)) {
        qWarning() << "Cannot open SVG:" << resourcePath;
        return {};
    }

    QByteArray svgData = file.readAll();

    // Lucide SVGs normally use currentColor.
    // Replace it with a color Qt can render explicitly.
    svgData.replace(
        "currentColor",
        strokeColor.name(QColor::HexRgb).toUtf8()
        );

    QSvgRenderer renderer(svgData);

    if (!renderer.isValid()) {
        qWarning() << "Invalid SVG:" << resourcePath;
        return {};
    }

    constexpr qreal deviceScale = 2.0;

    QPixmap pixmap(
        logicalSize.width() * 2,
        logicalSize.height() * 2
        );

    pixmap.setDevicePixelRatio(deviceScale);
    pixmap.fill(Qt::transparent);

    {
        QPainter painter(&pixmap);

        renderer.render(
            &painter,
            QRectF(
                0,
                0,
                logicalSize.width(),
                logicalSize.height()
                )
            );
    }

    return pixmap;
}


// Create a normal, single-colour SVG icon.
inline QIcon makeSvgIcon(
    const QString& resourcePath,
    const QSize& size,
    const QColor& color
    ) {
    QPixmap pixmap = renderSvgPixmap(
        resourcePath,
        size,
        color
        );

    return pixmap.isNull() ? QIcon{} : QIcon(pixmap);
}


// Create an icon with separate normal and checked colours.
inline QIcon makeStatefulSvgIcon(
    const QString& resourcePath,
    const QSize& size,
    const QColor& normalColor,
    const QColor& checkedColor
    ) {
    QIcon icon;

    QPixmap normal = renderSvgPixmap(
        resourcePath,
        size,
        normalColor
        );

    QPixmap checked = renderSvgPixmap(
        resourcePath,
        size,
        checkedColor
        );

    if (!normal.isNull()) {
        icon.addPixmap(
            normal,
            QIcon::Normal,
            QIcon::Off
            );
    }

    if (!checked.isNull()) {
        icon.addPixmap(
            checked,
            QIcon::Normal,
            QIcon::On
            );
    }

    return icon;
}