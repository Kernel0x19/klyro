#pragma once

#include <QWidget>
#include <QList>
#include <QString>

class QLabel;
class QLineEdit;
class QToolButton;

class TopBarWidget final : public QWidget {
    Q_OBJECT
public:
    explicit TopBarWidget(QWidget* parent = nullptr);
    void setDarkTheme(bool dark);

signals:
    void runRequested();
    void openRequested();
    void saveRequested();
    void themeToggleRequested();
    void moduleSelected(const QString& moduleName);

private:
    void setActiveModule(const QString& moduleName);

    QLineEdit* m_projectName = nullptr;
    QList<QToolButton*> m_moduleButtons;
    QString m_activeModule = "Board";
};
