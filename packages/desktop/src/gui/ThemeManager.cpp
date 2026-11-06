#include "gui/ThemeManager.hpp"

#include <QApplication>

ThemeColors ThemeManager::colors(bool dark)
{
    if (dark) {
        return {
            "#000000",
            "#1a1a1a",
            "#343a40",
            "#3e4864",
            "#e8eaf0",
            "#8b8fa8",
            "#4f6ef7",
            "rgba(255,255,255,0.10)"
        };
    }

    return {
        "#ffffff",
        "#f5f6fa",
        "#e8eaef",
        "#cbd0df",
        "#14161c",
        "#5a5f73",
        "#4f6ef7",
        "rgba(0,0,0,0.16)"
    };
}

void ThemeManager::apply(QApplication& app, bool dark)
{
    const ThemeColors c = colors(dark);
    const QString qss = QString(R"(
        QMainWindow, QWidget#AppRoot {
            background: %1;
            color: %2;
        }
        QWidget#TopBar {
            background: %1;
            border-bottom: 1px solid %4;
        }
        #PanelSurface {
            background-color: %3;
            border: 1px solid %4;
        }
        QGraphicsView#BoardView {
            background: %1;
            border: 1px solid %4;
        }
        #PanelHeader {
            background-color: %3;
            border-bottom: 1px solid %4;
        }
        #BoardView {
            border: 1px solid %4;
        }
        QWidget#BottomPanel {
            background: %3;
            border-top: 2px solid %4;
        }
        QLabel { color: %2; }
        QLabel[muted="true"] { color: %5; }
        QLineEdit, QTreeWidget, QTextEdit, QPlainTextEdit {
            background: %1; color: %2; border: 1px solid %4;
            border-radius: 5px; selection-background-color: %6;
            padding: 5px;
        }
        QTreeWidget { outline: 0; }
        QTreeWidget::item {
            padding: 4px 3px;
            border-radius: 3px;
        }
        QTreeWidget::item:hover { background: %7; }
        QTreeWidget::item:selected {
            background: rgba(79,110,247,0.16);
            color: %6;
        }
        QPushButton, QToolButton {
            background: transparent;
            color: %2;
            border: 1px solid transparent;
            border-radius: 5px;
            padding: 5px 8px;
        }
        QPushButton:hover, QToolButton:hover {
            background: %7;
            border-color: %4;
        }
        QPushButton:checked, QToolButton:checked {
            color: %6;
            background: rgba(79,110,247,0.13);
            border-color: rgba(79,110,247,0.25);
        }
        QToolButton#ModuleButton {
            font-size: 14px;
            font-weight: 600;
            padding: 8px 10px;
        }
        QToolButton#IconButton {
            min-width: 30px;
            min-height: 30px;
            padding: 3px;
        }
        QToolButton#ActiveModule {
            color: %6;
            border-bottom: 2px solid %6;
            border-radius: 0px;
        }
        QFrame[frameShape="4"] { color: %4; }
        QStatusBar {
            background: %3;
            color: %5;
            border-top: 1px solid %4;
        }
        QScrollBar:vertical {
            background: %3;
            width: 9px;
            margin: 2px;
        }
        QScrollBar::handle:vertical {
            background: %4;
            min-height: 24px;
            border-radius: 4px;
        }
        QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical { height: 0px; }
    )").arg(c.background, c.text, c.surface, c.border, c.muted, c.accent,
           dark ? QStringLiteral("#343a40") : QStringLiteral("#e8eaef"));

    app.setStyleSheet(qss);
}
