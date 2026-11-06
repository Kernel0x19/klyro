#pragma once

#include <QMainWindow>
#include <QStringList>

QT_BEGIN_NAMESPACE
namespace Ui { class MainWindow; }
QT_END_NAMESPACE

class TopBarWidget;
class ICLibraryPanel;
class PropertiesPanel;
class BottomPanel;
class BoardView;

class MainWindow final : public QMainWindow {
    Q_OBJECT
public:
    explicit MainWindow(QWidget* parent = nullptr);
    ~MainWindow() override;

private slots:
    void onSlotSelected(int slotIndex);
    void onICPicked(const QString& partNumber, const QString& description);
    void toggleTheme();
    void showModule(const QString& name);
    void runSimulationPlaceholder();
    void openProjectPlaceholder();
    void saveProjectPlaceholder();

private:
    void applyTheme();
    void updateWindowStatus(const QString& message);

    Ui::MainWindow* ui = nullptr;
    TopBarWidget* m_topBar = nullptr;
    ICLibraryPanel* m_library = nullptr;
    PropertiesPanel* m_properties = nullptr;
    BottomPanel* m_bottom = nullptr;
    BoardView* m_board = nullptr;
    QStringList m_slotParts = {"", "", "", "", ""};
    QStringList m_slotDescriptions = {"", "", "", "", ""};
    int m_selectedSlot = -1;
    bool m_dark = true;
    bool m_powerOn = true;
};
