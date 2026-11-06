#include "gui/MainWindow.hpp"

#include "gui/BottomPanel.hpp"
#include "gui/BoardView.hpp"
#include "gui/ICLibraryPanel.hpp"
#include "gui/PropertiesPanel.hpp"
#include "gui/ThemeManager.hpp"
#include "gui/TopBarWidget.hpp"
#include "ui_mainwindow.h"

#include <QApplication>
#include <QFileDialog>
#include <QSettings>
#include <QStatusBar>
#include <QVBoxLayout>

MainWindow::MainWindow(QWidget* parent)
    : QMainWindow(parent), ui(new Ui::MainWindow)
{
    ui->setupUi(this);
    setObjectName("AppRoot");
    setWindowTitle("Klyro — Digital Circuit Simulator");
    resize(1600, 830);

    QSettings settings("Klyro", "KlyroDesktop");
    m_dark = settings.value("theme/dark", true).toBool();

    m_topBar = new TopBarWidget(ui->topBarHost);
    ui->topBarHostLayout->addWidget(m_topBar);

    m_library = new ICLibraryPanel(ui->leftPanelHost);
    ui->leftPanelHostLayout->addWidget(m_library);

    m_properties = new PropertiesPanel(ui->rightPanelHost);
    ui->rightPanelHostLayout->addWidget(
        m_properties,
        0,
        Qt::AlignRight
    );

    m_bottom = new BottomPanel(ui->bottomPanelHost);
    ui->bottomPanelHostLayout->addWidget(m_bottom);
    ui->bottomPanelHost->setFixedHeight(32);

    m_board = ui->boardView;
    m_board->setSlotPart(0, QString());

    connect(m_board, &BoardView::slotClicked, this, &MainWindow::onSlotSelected);
    connect(m_board, &BoardView::powerToggled, this, [this](bool on) {
        m_powerOn = on;
        updateWindowStatus(on ? "Board power ON" : "Board power OFF");
    });
    connect(m_board, &BoardView::inputToggled, this, [this](int index, bool high) {
        updateWindowStatus(QString("Input %1 set to %2").arg(15 - index).arg(high ? "HIGH" : "LOW"));
        // Later: forward this input transition to Simulator::setInput(...).
    });
    connect(m_library, &ICLibraryPanel::icPicked, this, &MainWindow::onICPicked);
    connect(m_library, &ICLibraryPanel::toolChanged, this, [this](const QString& tool) {
        m_board->setPanMode(tool == "pan");
        if (tool == "wire") updateWindowStatus("Wire tool selected — wire interaction is the next implementation stage");
        else if (tool == "delete") updateWindowStatus("Delete tool selected — deletion interaction is the next implementation stage");
    });
    connect(m_bottom, &BottomPanel::collapseChanged, this, [this](bool collapsed) {
        ui->bottomPanelHost->setFixedHeight(collapsed ? 32 : 164);
    });

    connect(m_topBar, &TopBarWidget::runRequested, this, &MainWindow::runSimulationPlaceholder);
    connect(m_topBar, &TopBarWidget::openRequested, this, &MainWindow::openProjectPlaceholder);
    connect(m_topBar, &TopBarWidget::saveRequested, this, &MainWindow::saveProjectPlaceholder);
    connect(m_topBar, &TopBarWidget::themeToggleRequested, this, &MainWindow::toggleTheme);
    connect(m_topBar, &TopBarWidget::moduleSelected, this, &MainWindow::showModule);

    applyTheme();
    statusBar()->showMessage("Ready — select an IC slot, then choose an IC from the library.");
}

MainWindow::~MainWindow()
{
    delete ui;
}

void MainWindow::onSlotSelected(int slotIndex)
{
    m_selectedSlot = slotIndex;
    m_board->setSelectedSlot(slotIndex);
    m_properties->showSlot(slotIndex, m_slotParts.value(slotIndex));
    updateWindowStatus(QString("IC slot %1 selected").arg(slotIndex + 1));
}

void MainWindow::onICPicked(const QString& partNumber, const QString& description)
{
    if (m_selectedSlot < 0) {
        for (int i = 0; i < m_slotParts.size(); ++i) {
            if (m_slotParts[i].isEmpty()) {
                m_selectedSlot = i;
                break;
            }
        }
    }
    if (m_selectedSlot < 0) {
        updateWindowStatus("All five IC slots are occupied. Select a slot before assigning another IC.");
        return;
    }

    m_slotParts[m_selectedSlot] = partNumber;
    m_slotDescriptions[m_selectedSlot] = description;
    m_board->setSelectedSlot(m_selectedSlot);
    m_board->setSlotPart(m_selectedSlot, partNumber);
    m_properties->showSlot(m_selectedSlot, partNumber);
    updateWindowStatus(QString("Assigned %1 to IC slot %2").arg(partNumber).arg(m_selectedSlot + 1));
}

void MainWindow::toggleTheme()
{
    m_dark = !m_dark;
    QSettings settings("Klyro", "KlyroDesktop");
    settings.setValue("theme/dark", m_dark);
    applyTheme();
    updateWindowStatus(m_dark ? "Dark theme" : "Light theme");
}

void MainWindow::applyTheme()
{
    ThemeManager::apply(*qApp, m_dark);
    m_topBar->setDarkTheme(m_dark);
    m_board->setDarkTheme(m_dark);
    m_library->setDarkTheme(m_dark);
    m_properties->setDarkTheme(m_dark);
}

void MainWindow::showModule(const QString& name)
{
    if (name == "Board") {
        updateWindowStatus("Board workspace");
        return;
    }
    updateWindowStatus(QString("%1 module is a future workspace in this desktop build.").arg(name));
}

void MainWindow::runSimulationPlaceholder()
{
    if (!m_powerOn) {
        updateWindowStatus("Turn Board power ON before running the simulation.");
        return;
    }
    updateWindowStatus("UI shell is ready. Connect Simulator::evaluate() here when the core engine is added.");
}

void MainWindow::openProjectPlaceholder()
{
    const QString path = QFileDialog::getOpenFileName(
        this, "Open Klyro Project", QString(), "Klyro project (*.klyro);;JSON files (*.json);;All files (*)");
    if (!path.isEmpty()) updateWindowStatus("Project loading is not connected yet: " + path);
}

void MainWindow::saveProjectPlaceholder()
{
    const QString path = QFileDialog::getSaveFileName(
        this, "Save Klyro Project", "Untitled.klyro", "Klyro project (*.klyro);;JSON files (*.json)");
    if (!path.isEmpty()) updateWindowStatus("Project serialization is not connected yet: " + path);
}

void MainWindow::updateWindowStatus(const QString& message)
{
    statusBar()->showMessage(message, 5000);
}
