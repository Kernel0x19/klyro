#pragma once

#include <QWidget>
#include <QString>

class QLabel;
class QStackedWidget;

class PropertiesPanel final : public QWidget {
    Q_OBJECT
public:
    explicit PropertiesPanel(QWidget* parent = nullptr);
    void setDarkTheme(bool dark);
    void showSlot(int slotIndex, const QString& partNumber);

signals:
    void collapseChanged(bool collapsed);

private:
    void setCollapsed(bool collapsed);
    QStackedWidget* m_stack = nullptr;
    QWidget* m_expanded = nullptr;
    QWidget* m_collapsedRail = nullptr;
    QLabel* m_title = nullptr;
    QLabel* m_description = nullptr;
    bool m_collapsed = false;
    bool m_dark = true;
};
