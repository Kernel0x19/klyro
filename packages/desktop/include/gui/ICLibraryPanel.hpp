#pragma once

#include <QWidget>
#include <QString>

class QTreeWidget;
class QLineEdit;
class QToolButton;
class QStackedWidget;

class ICLibraryPanel final : public QWidget {
    Q_OBJECT
public:
    explicit ICLibraryPanel(QWidget* parent = nullptr);
    bool isCollapsed() const { return m_collapsed; }
    void setDarkTheme(bool dark);

signals:
    void collapseChanged(bool collapsed);
    void icPicked(const QString& partNumber, const QString& description);
    void toolChanged(const QString& toolName);

private slots:
    void filterItems(const QString& text);
    void onItemClicked(class QTreeWidgetItem* item, int column);
    void setCollapsed(bool collapsed);
    void setActiveTool(const QString& toolName);

private:
    QWidget* buildExpanded();
    QWidget* buildCollapsed();
    QTreeWidget* m_tree = nullptr;
    QLineEdit* m_search = nullptr;
    QStackedWidget* m_stack = nullptr;
    QWidget* m_expanded = nullptr;
    QWidget* m_collapsedRail = nullptr;
    bool m_collapsed = false;
    QString m_activeTool = "select";
    bool m_dark = true;
};
