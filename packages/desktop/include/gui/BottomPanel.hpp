#pragma once

#include <QWidget>

class QStackedWidget;
class QToolButton;

class BottomPanel final : public QWidget {
    Q_OBJECT
public:
    explicit BottomPanel(QWidget* parent = nullptr);
    bool isCollapsed() const { return m_collapsed; }

signals:
    void collapseChanged(bool collapsed);

private:
    void setCollapsed(bool collapsed);
    void setActiveTab(int index);
    QStackedWidget* m_pages = nullptr;
    QToolButton* m_tabs[3] = {nullptr, nullptr, nullptr};
    QToolButton* m_toggleButton = nullptr;
    bool m_collapsed = true;
};
