#pragma once

#include <QString>

class QApplication;

struct ThemeColors {
    QString background;
    QString surface;
    QString elevated;
    QString border;
    QString text;
    QString muted;
    QString accent;
    QString grid;
};

class ThemeManager {
public:
    static ThemeColors colors(bool dark);
    static void apply(QApplication& app, bool dark);
};
